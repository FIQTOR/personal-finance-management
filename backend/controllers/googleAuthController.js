const passport = require('passport');
const User = require("../models/user");
const { sign } = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Role = require('../models/role');
const Permission = require('../models/permission');
const RolePermission = require('../models/rolePermission');
const AppSetting = require('../models/appSetting');
const UserActivity = require('../models/userActivity');
const UserSession = require('../models/userSession');

const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Configure Passport with Google OAuth strategy
passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback", // placeholder (relative path)
        passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ where: { email: profile.emails[0].value } });

            if (!user) {
                const salt = await bcrypt.genSalt(10);
                const randomPassword = Math.random().toString(36).slice(-8);
                const hash = await bcrypt.hash(randomPassword, salt);

                let role = await Role.findOne({ where: { name: 'user' } });
                if (!role) {
                    role = await Role.create({ name: 'user', description: 'Personal Finance System Owner' });
                }

                const defaultPermissions = [
                    { name: 'view_dashboard', description: 'Can view dashboard' },
                    { name: 'manage_users', description: 'Can manage users' },
                    { name: 'manage_roles', description: 'Can manage roles and permissions' },
                    { name: 'all_access', description: 'Has all access permissions' }
                ];

                for (const permData of defaultPermissions) {
                    const [perm] = await Permission.findOrCreate({
                        where: { name: permData.name },
                        defaults: { description: permData.description }
                    });
                    await RolePermission.findOrCreate({
                        where: { role_id: role.id, permission_id: perm.id }
                    });
                }

                user = await User.create({
                    google_id: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    is_verified: true,
                    avatar_url: profile.photos[0].value,
                    role_id: role.id,
                    password: hash,
                    created_at: new Date(),
                    updated_at: new Date()
                });
            }

            await UserActivity.create({
                user_id: user.id,
                activity_type: 'google_login',
                status: 'info',
                description: 'User logged in via Google',
                ip_address: 'Google OAuth',
                user_agent: 'Google OAuth Service'
            });

            if (user && !user.google_id) {
                user.google_id = profile.id;
                await user.save();
            }

            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Utility to build base URL automatically
function getBaseUrl(req) {
    if (process.env.NODE_ENV === "production") {
        return `https://${req.get("host")}`;
    }
    return req.protocol + "://" + req.get("host"); // dev
}

// Redirect user to Google login
const loginWithGoogle = (req, res, next) => {
    const baseUrl = getBaseUrl(req);
    const { currency, lang, origin } = req.query;
    const stateObj = { origin: origin || '/panel/dashboard', currency, lang };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');

    passport.authenticate("google", {
        scope: ["profile", "email"],
        callbackURL: `${baseUrl}/api/auth/google/callback`,
        state
    })(req, res, next);
};

// Handle Google OAuth callback
const googleCallback = [
    (req, res, next) => {
        const baseUrl = getBaseUrl(req);
        passport.authenticate("google", {
            failureRedirect: `${process.env.FRONTEND_HOST}`,
            callbackURL: `${baseUrl}/api/auth/google/callback`
        })(req, res, next);
    },
    async (req, res) => {
        const user = await User.findOne({
            where: { id: req.user.id },
            include: [{
                association: 'role',
                attributes: ['name'],
                include: [{
                    association: 'permissions',
                    attributes: ['name'],
                    through: RolePermission
                }]
            }]
        });

        if (!user || !user.role) {
            return res.status(404).json({ status: "failed", message: "User or role not found!" });
        }

        if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
            throw new Error("Token secrets are not defined");
        }

        const refreshToken = sign(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                avatar_url: user.avatar_url,
                is_verified: user.is_verified,
                is_blocked: user.is_blocked,
                created_at: user.created_at,
                updated_at: user.updated_at,
                password: undefined
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "1d" }
        );

        const cookieMaxAge = 30 * 24 * 60 * 60 * 1000;

        await UserSession.create({
            user_id: user.id,
            token: refreshToken,
            device_info: req.headers['user-agent'],
            ip_address: req.ip,
            expires_at: new Date(Date.now() + cookieMaxAge)
        });

        // Set refresh token as HTTP-only cookie
        if (process.env.NODE_ENV === 'development') {
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "None",
                maxAge: cookieMaxAge,
                path: "/",
            });
        } else {
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "None",
                domain: ".iarty.id", // Change this sync your domain
                maxAge: cookieMaxAge,
                path: "/",
            });
        }

        const origin = req.query.state || '/panel/dashboard';
        let stateObj = { origin };
        try {
            if (req.query.state) {
                const decodedState = Buffer.from(req.query.state, 'base64').toString('utf-8');
                const parsed = JSON.parse(decodedState);
                if (parsed && typeof parsed === 'object') {
                    stateObj = parsed;
                }
            }
        } catch {
            // fallback
        }

        if (stateObj.currency) {
            await AppSetting.upsert({ key: 'default_currency', value: stateObj.currency });
        }
        if (stateObj.lang) {
            await AppSetting.upsert({ key: 'default_language', value: stateObj.lang });
        }

        res.redirect(`${process.env.FRONTEND_HOST}${stateObj.origin || '/panel/dashboard'}`);
    }
];

module.exports = { loginWithGoogle, googleCallback };
