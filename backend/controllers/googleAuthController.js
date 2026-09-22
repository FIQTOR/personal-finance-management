const passport = require('passport');
const crypto = require('crypto');
const User = require('../models/user');
const Role = require('../models/role');
const RolePermission = require('../models/rolePermission');
const AppSetting = require('../models/appSetting');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { hashPassword } = require('../utils/password');
const { safeInternalPath } = require('../utils/sanitize');
const activityService = require('../services/activityService');
const authService = require('../services/authService');

const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Configure Passport with Google OAuth strategy.
passport.use(new GoogleStrategy(
    {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error('Google account has no email'), null);

            let user = await User.findOne({ where: { email } });

            if (!user) {
                const role = await Role.findOne({ where: { name: 'user' } });
                if (!role) return done(new Error('Role not found'), null);

                const randomPassword = crypto.randomBytes(24).toString('hex');
                user = await User.create({
                    google_id: profile.id,
                    name: profile.displayName,
                    email,
                    is_verified: true,
                    avatar_url: profile.photos?.[0]?.value || null,
                    role_id: role.id,
                    password: await hashPassword(randomPassword),
                });
            } else if (!user.google_id) {
                user.google_id = profile.id;
                await user.save();
            }

            await activityService.logActivity(req, {
                userId: user.id,
                activityType: 'google_login',
                description: 'User logged in via Google',
            });

            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    }
));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

/**
 * Build the absolute base URL for the current request.
 * @param {import('express').Request} req
 */
function getBaseUrl(req) {
    if (env.isProduction) return `https://${req.get('host')}`;
    return `${req.protocol}://${req.get('host')}`;
}

// Redirect the user to Google's consent screen.
// The `origin` query is validated as a safe internal path; currency/lang are
// passed separately so they cannot smuggle an external redirect.
const loginWithGoogle = (req, res, next) => {
    const baseUrl = getBaseUrl(req);
    const origin = safeInternalPath(req.query.origin, '/panel/dashboard');
    const { currency, lang } = req.query;

    // Encode the small, validated state payload (origin is already sanitised).
    const state = Buffer.from(JSON.stringify({ origin, currency, lang })).toString('base64');

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        callbackURL: `${baseUrl}/api/auth/google/callback`,
        state,
    })(req, res, next);
};

// Handle the Google OAuth callback.
const googleCallback = [
    (req, res, next) => {
        const baseUrl = getBaseUrl(req);
        passport.authenticate('google', {
            failureRedirect: `${env.FRONTEND_HOST}/signin`,
            callbackURL: `${baseUrl}/api/auth/google/callback`,
        })(req, res, next);
    },
    async (req, res, next) => {
        try {
            const user = await User.findOne({
                where: { id: req.user.id },
                include: [{
                    association: 'role',
                    attributes: ['name'],
                    include: [{
                        association: 'permissions',
                        attributes: ['name'],
                        through: RolePermission,
                    }],
                }],
            });

            if (!user || !user.role) {
                throw new AppError('User or role not found!', 404, { code: 'USER_NOT_FOUND' });
            }

            await authService.issueTokens(req, res, user, { rememberMe: true });

            // Decode the (validated) state payload for redirect + app settings.
            let state = {};
            try {
                if (req.query.state) {
                    state = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf-8'));
                }
            } catch {
                state = {};
            }

            if (state.currency) {
                await AppSetting.upsert({ key: 'default_currency', value: state.currency });
            }
            if (state.lang) {
                await AppSetting.upsert({ key: 'default_language', value: state.lang });
            }

            // Always re-validate the redirect target (defence in depth).
            const redirectPath = safeInternalPath(state.origin, '/panel/dashboard');
            return res.redirect(`${env.FRONTEND_HOST}${redirectPath}`);
        } catch (error) {
            return next(error);
        }
    },
];

module.exports = { loginWithGoogle, googleCallback };
