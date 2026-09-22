const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Role = require('../models/role');
const Permission = require('../models/permission');
const RolePermission = require('../models/rolePermission');
const AppSetting = require('../models/appSetting');
const VerificationToken = require('../models/verificationToken');
const ResetPasswordToken = require('../models/resetPasswordToken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const { hashPassword, comparePassword, assertStrongPassword } = require('../utils/password');
const { generateToken, hashToken } = require('../utils/tokenHash');
const { clearRefreshCookie, getRefreshCookie } = require('../utils/cookies');
const { SendVerificationEmail, SendResetPasswordEmail } = require('../services/mailer');
const tokenService = require('../services/tokenService');
const authService = require('../services/authService');
const loginAttemptService = require('../services/loginAttemptService');
const activityService = require('../services/activityService');

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Load a user with their role and permissions.
 * @param {object} where
 * @param {boolean} [withSecrets=false] - include password (for login only).
 */
const findUserWithRole = (where, withSecrets = false) =>
    User.scope(withSecrets ? 'withSecrets' : 'defaultScope').findOne({
        where,
        include: [{
            association: 'role',
            attributes: ['name'],
            include: [{
                association: 'permissions',
                attributes: ['name', 'description'],
                through: { attributes: [] },
            }],
        }],
    });

/**
 * Refresh an access token using a valid refresh token cookie.
 * Also rejects blocked accounts so a ban takes effect on the next refresh.
 */
exports.refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = getRefreshCookie(req);
    if (!refreshToken) {
        throw new AppError('No refresh token provided', 401, { code: 'NO_REFRESH_TOKEN' });
    }

    const session = await tokenService.findSessionByToken(refreshToken);
    if (!session) {
        clearRefreshCookie(res);
        throw new AppError('Invalid session. Please login again.', 401, { code: 'INVALID_SESSION' });
    }

    try {
        jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        clearRefreshCookie(res);
        throw new AppError('Invalid refresh token', 403, { code: 'INVALID_REFRESH_TOKEN' });
    }

    const user = await findUserWithRole({ id: session.user_id });
    if (!user || user.deleted_at) {
        clearRefreshCookie(res);
        throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    }
    if (user.is_blocked) {
        throw new AppError('Your account has been suspended', 403, { code: 'ACCOUNT_BLOCKED' });
    }
    if (!user.role) {
        throw new AppError('Role not found', 404, { code: 'ROLE_NOT_FOUND' });
    }

    const accessToken = tokenService.generateAccessToken(user, user.role);
    return success(res, { message: 'Token refreshed successfully', data: { accessToken } });
});

/**
 * Check whether the current request is authenticated (based on refresh cookie).
 */
exports.checkAuth = asyncHandler(async (req, res) => {
    const refreshToken = getRefreshCookie(req);
    if (!refreshToken) {
        return success(res, { message: 'User is not logged in', data: { auth: false } });
    }

    const session = await tokenService.findSessionByToken(refreshToken);
    if (!session) {
        return success(res, { message: 'User is not logged in', data: { auth: false } });
    }

    return success(res, { message: 'User is logged in', data: { auth: true } });
});

/**
 * Authenticate a user and issue tokens.
 */
exports.login = asyncHandler(async (req, res) => {
    const { email, password, remember_me } = req.body;
    const ipAddress = req.ip;

    if (!email || !password) {
        throw new AppError('Email and password are required', 400, { code: 'MISSING_CREDENTIALS' });
    }

    // Block IPs with too many recent failed attempts.
    const ban = await loginAttemptService.checkBan(ipAddress);
    if (ban.banned) {
        throw new AppError(
            `Too many failed attempts. Please try again in ${ban.minutesLeft} minutes.`,
            429,
            { code: 'IP_BANNED' }
        );
    }

    const user = await findUserWithRole({ email }, true);
    if (!user) {
        throw new AppError('Invalid email or password.', 401, { code: 'INVALID_CREDENTIALS' });
    }
    if (!user.role) {
        throw new AppError('Account access error. Please contact support.', 401, { code: 'NO_ROLE' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
        const { banned } = await loginAttemptService.recordFailedAttempt(ipAddress);
        if (banned) {
            await activityService.logActivity(req, {
                userId: user.id,
                activityType: 'login_blocked',
                status: 'warning',
                description: `IP ${ipAddress} blocked after multiple failed login attempts`,
                isGeneral: false,
            });
        }
        throw new AppError('Invalid email or password.', 401, { code: 'INVALID_CREDENTIALS' });
    }

    const { accessToken } = await authService.issueTokens(req, res, user, { rememberMe: !!remember_me });

    await loginAttemptService.resetAttempts(ipAddress);
    await activityService.logActivity(req, {
        userId: user.id,
        activityType: 'login',
        description: 'User logged in successfully',
    });

    return success(res, { message: 'Login successful', data: { accessToken } });
});

/**
 * CheckSetup - Checks if system initial setup is required (0 users in DB).
 */
exports.checkSetup = asyncHandler(async (req, res) => {
    const count = await User.count();
    return success(res, { message: 'Setup status', data: { setupRequired: count === 0 } });
});

/**
 * Setup - Creates the initial owner/admin user during first-run setup.
 * Only allowed while the users table is empty.
 */
exports.setup = asyncHandler(async (req, res) => {
    const { name, email, password, currency, language } = req.body;

    const count = await User.count();
    if (count > 0) {
        throw new AppError('Setup has already been completed.', 400, { code: 'SETUP_COMPLETE' });
    }

    if (!name || !email || !password) {
        throw new AppError('Name, email, and password are required.', 400, { code: 'MISSING_FIELDS' });
    }
    assertStrongPassword(password);

    if (currency) {
        await AppSetting.upsert({ key: 'default_currency', value: currency });
    }
    if (language) {
        await AppSetting.upsert({ key: 'default_language', value: language });
    }

    let role = await Role.findOne({ where: { name: 'user' } });
    if (!role) {
        role = await Role.create({ name: 'user', description: 'Personal Finance System Owner' });
    }

    const defaultPermissions = [
        { name: 'view_dashboard', description: 'Can view dashboard' },
        { name: 'manage_users', description: 'Can manage users' },
        { name: 'manage_roles', description: 'Can manage roles and permissions' },
        { name: 'all_access', description: 'Has all access permissions' },
    ];

    for (const permData of defaultPermissions) {
        const [perm] = await Permission.findOrCreate({
            where: { name: permData.name },
            defaults: { description: permData.description },
        });
        await RolePermission.findOrCreate({
            where: { role_id: role.id, permission_id: perm.id },
        });
    }

    const user = await User.create({
        name,
        email,
        password: await hashPassword(password),
        role_id: role.id,
        is_verified: true,
    });

    user.role = role;

    const { accessToken } = await authService.issueTokens(req, res, user, { rememberMe: true });

    await activityService.logActivity(req, {
        userId: user.id,
        activityType: 'setup',
        description: 'Initial system setup completed',
    });

    return success(res, {
        statusCode: 201,
        message: 'Setup completed successfully!',
        data: { accessToken },
    });
});

/**
 * Log out by destroying the current session.
 */
exports.logout = asyncHandler(async (req, res) => {
    const refreshToken = getRefreshCookie(req);
    if (!refreshToken) {
        throw new AppError('No refresh token provided', 401, { code: 'NO_REFRESH_TOKEN' });
    }

    await tokenService.destroySessionByToken(refreshToken);
    clearRefreshCookie(res);

    return success(res, { message: 'Successfully logged out' });
});

/**
 * Verify a user's email using a verification token.
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!token) {
        throw new AppError('Token is required', 400, { code: 'TOKEN_REQUIRED' });
    }

    const verificationToken = await VerificationToken.findOne({
        where: { token_hash: hashToken(token) },
    });

    if (!verificationToken) {
        return res.status(400).json({
            success: false,
            message: 'Expired or invalid token',
            data: { type: 'expired_token' },
        });
    }

    const user = await User.findOne({
        where: { id: verificationToken.user_id },
        attributes: ['id', 'is_verified', 'email'],
    });

    if (!user) {
        await verificationToken.destroy();
        return res.status(404).json({
            success: false,
            message: 'User not found',
            data: { type: 'user_not_found' },
        });
    }

    if (user.is_verified) {
        await verificationToken.destroy();
        return success(res, {
            message: 'Your email is already verified',
            data: { type: 'already_verified' },
        });
    }

    if (verificationToken.expires_at < new Date()) {
        await verificationToken.destroy();
        return res.status(400).json({
            success: false,
            message: 'Expired token',
            data: { type: 'expired_token' },
        });
    }

    await User.update({ is_verified: true }, { where: { id: verificationToken.user_id } });
    await verificationToken.destroy();

    return success(res, {
        message: 'Email verified successfully',
        data: { type: 'newly_verified' },
    });
});

/**
 * Resend the email verification link (60s cooldown).
 */
exports.resendEmailVerification = asyncHandler(async (req, res) => {
    const refreshToken = getRefreshCookie(req);
    if (!refreshToken) {
        throw new AppError('No refresh token provided', 401, { code: 'NO_REFRESH_TOKEN' });
    }

    const session = await tokenService.findSessionByToken(refreshToken);
    if (!session) {
        throw new AppError('Invalid session', 401, { code: 'INVALID_SESSION' });
    }

    const user = await User.findByPk(session.user_id);
    if (!user) {
        throw new AppError('User not found!', 404, { code: 'USER_NOT_FOUND' });
    }
    if (user.is_verified) {
        throw new AppError('Email is already verified!', 400, { code: 'ALREADY_VERIFIED' });
    }

    const existing = await VerificationToken.findOne({ where: { user_id: user.id } });
    if (existing) {
        const elapsed = (Date.now() - new Date(existing.created_at).getTime()) / 1000;
        if (elapsed < RESEND_COOLDOWN_SECONDS) {
            return res.status(400).json({
                success: false,
                message: 'Please wait before requesting another verification email',
                data: { time: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed) },
            });
        }
        await existing.destroy();
    }

    const token = generateToken();
    await VerificationToken.create({
        user_id: user.id,
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + TOKEN_TTL_MS),
    });

    await SendVerificationEmail(user.email, token);

    return success(res, { message: 'Email verification sent!' });
});

/**
 * Request a password reset email.
 *
 * Always responds with a generic success message to avoid leaking which emails
 * are registered (user enumeration).
 */
exports.requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const genericResponse = {
        message: 'If that email is registered, a password reset link has been sent.',
        data: { time: RESEND_COOLDOWN_SECONDS },
    };

    if (!email) {
        throw new AppError('Email is required', 400, { code: 'EMAIL_REQUIRED' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
        // Do not reveal that the email is unknown.
        return success(res, genericResponse);
    }

    const existing = await ResetPasswordToken.findOne({ where: { user_id: user.id } });
    if (existing) {
        const elapsed = (Date.now() - new Date(existing.created_at).getTime()) / 1000;
        if (elapsed < RESEND_COOLDOWN_SECONDS) {
            return res.status(400).json({
                success: false,
                message: 'Please wait before requesting another password reset',
                data: { time: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed) },
            });
        }
        await existing.destroy();
    }

    const token = generateToken();
    await ResetPasswordToken.create({
        user_id: user.id,
        token_hash: hashToken(token),
        expires_at: new Date(Date.now() + TOKEN_TTL_MS),
    });

    await SendResetPasswordEmail(user.email, token);

    return success(res, genericResponse);
});

/**
 * Reset a password using a valid reset token.
 */
exports.resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        throw new AppError('Token and new password are required', 400, { code: 'MISSING_FIELDS' });
    }
    assertStrongPassword(newPassword);

    const resetToken = await ResetPasswordToken.findOne({
        where: { token_hash: hashToken(token) },
    });

    if (!resetToken) {
        throw new AppError('Invalid token!', 400, { code: 'INVALID_TOKEN' });
    }

    if (resetToken.expires_at < new Date()) {
        await resetToken.destroy();
        throw new AppError('Token has expired!', 400, { code: 'TOKEN_EXPIRED' });
    }

    const user = await User.findOne({ where: { id: resetToken.user_id } });
    if (!user) {
        throw new AppError('User not found!', 404, { code: 'USER_NOT_FOUND' });
    }

    await user.update({
        password: await hashPassword(newPassword),
        last_password_change: new Date(),
    });

    await activityService.logActivity(req, {
        userId: user.id,
        activityType: 'password_reset',
        description: 'User reset their password',
    });

    // Invalidate all existing sessions after a password change.
    await tokenService.destroyAllSessionsForUser(user.id);
    await resetToken.destroy();

    return success(res, { message: 'Password reset successfully!' });
});

/**
 * Check whether a password reset token is valid.
 */
exports.checkResetPasswordToken = asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!token) {
        throw new AppError('Token is required', 400, { code: 'TOKEN_REQUIRED' });
    }

    const resetToken = await ResetPasswordToken.findOne({
        where: { token_hash: hashToken(token) },
    });

    if (!resetToken) {
        throw new AppError('Invalid token!', 400, { code: 'INVALID_TOKEN' });
    }

    if (resetToken.expires_at < new Date()) {
        await resetToken.destroy();
        throw new AppError('Token has expired!', 400, { code: 'TOKEN_EXPIRED' });
    }

    return success(res, { message: 'Token is valid!' });
});

/**
 * Return the authenticated user's profile (safe fields) and permissions.
 *
 * The access token intentionally carries only `{ id, role }`, so the client
 * fetches the rest of the user object from here.
 */
exports.getAuthPermissions = asyncHandler(async (req, res) => {
    const user = await findUserWithRole({ id: req.user.id });

    if (!user || !user.role) {
        throw new AppError('User or role not found', 404, { code: 'USER_NOT_FOUND' });
    }

    return success(res, {
        message: 'Permissions retrieved successfully',
        data: {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar_url: user.avatar_url,
                is_verified: user.is_verified,
                is_blocked: user.is_blocked,
                created_at: user.created_at,
                updated_at: user.updated_at,
                role: {
                    name: user.role.name,
                    permissions: user.role.permissions,
                },
            },
            permissions: user.role.permissions,
        },
    });
});
