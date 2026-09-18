const { sign, verify } = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const User = require("../models/user");
const Role = require("../models/role");
const Permission = require("../models/permission");
const rolePermission = require("../models/rolePermission");
const AppSetting = require("../models/appSetting");
const VerificationToken = require("../models/verificationtoken");
const ResetPasswordToken = require("../models/resetpasswordtoken");

const { SendVerificationEmail, SendResetPasswordEmail } = require('../services/mailer');
const UserActivity = require("../models/userActivity");
const FailedLoginAttempt = require("../models/failedLoginAttempt");
const { Op } = require("sequelize");
const UserSession = require("../models/userSession");

/**
 * RefreshToken - Handles the token refresh process for authenticated users
 * 
 * This function refreshes the access token using a valid refresh token. It performs:
 * 1. Validates the refresh token from cookies
 * 2. Finds the user associated with the refresh token
 * 3. Retrieves user's role and permissions
 * 4. Verifies the refresh token's validity
 * 5. Generates a new access token if refresh token is valid
 * 
 * @param {Object} req - Express request object containing refresh token in cookies
 *                      req.cookies.refreshToken - User's refresh token
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with new access token or error message
 * 
 * @throws {Error} When token secrets are not defined or database operations fail
 */
exports.RefreshToken = async (req, res) => {
    // Extract refresh token from cookies
    const refreshToken = req.cookies.refreshToken;

    // Check if refresh token exists
    if (!refreshToken) return res.status(200).json({ status: "failed", message: "No refresh token provided" });

    try {
        const session = await UserSession.findOne({ where: { token: refreshToken } });

        if (!session) {
            res.clearCookie("refreshToken");
            return res.status(401).json({
                status: "failed",
                message: "Invalid session. Please login again."
            });
        }

        // Find user with the provided refresh token and include role association
        const user = await User.findOne({
            where: { id: session.user_id },
            include: [{
                association: 'role',
                attributes: ['name'],
                include: [{
                    association: 'permissions',
                    attributes: ['name'],
                    through: rolePermission
                }]
            }]
        });

        // Return error if role not found
        if (!user.role) {
            return res.status(404).json({ status: "failed", message: "Role not found!" });
        }

        // Verify refresh token secret exists
        if (!process.env.REFRESH_TOKEN_SECRET) {
            throw new Error("Refresh token secret is not defined");
        }

        // Verify refresh token validity
        verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ status: "failed", message: "Invalid refresh token" });
            }

            // Verify access token secret exists
            if (!process.env.ACCESS_TOKEN_SECRET) {
                throw new Error("Access token secret is not defined");
            }

            // Generate new access token with user information
            const accessToken = sign(
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
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: "20s" }
            );

            // Return new access token
            res.json({ accessToken });
        });
    } catch (error) {
        // Handle any errors during the process
        // console.log(error)
        res.status(500).json({ error: error.message });
    }
};

/**
 * Check - Verifies if a user is currently logged in
 * 
 * This function checks the authentication status of a user by:
 * 1. Checking for the presence of a refresh token in cookies
 * 2. Validating the refresh token against the database
 * 
 * @param {Object} req - Express request object containing cookies
 *                      req.cookies.refreshToken - User's refresh token
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with authentication status
 *                   {auth: boolean, message: string}
 * 
 * @throws {Error} When database operations fail
 */
exports.Check = async (req, res) => {
    try {
        // Get refresh token from cookies
        const refreshToken = req.cookies.refreshToken;

        // If no refresh token exists, user is not logged in
        if (!refreshToken) {
            return res.status(200).json({ auth: false, message: "User is not logged in" });
        }

        // Find user with matching refresh token
        const session = await UserSession.findOne({ where: { token: refreshToken } });

        // If no user found with token, user is not logged in
        if (!session) {
            return res.status(200).json({ auth: false, message: "User is not logged in" });
        }

        // User is authenticated
        res.status(200).json({ auth: true, message: "User is logged in" });
    } catch (error) {
        // Handle any errors during the process
        res.status(500).json({ status: "failed", message: error.message });
    }
};

/**
 * Login - Handles user authentication and login process
 * 
 * This function authenticates users and manages the login process. It performs the following steps:
 * 1. Validates user credentials (email and password)
 * 2. Retrieves user information from database
 * 3. Verifies user's role and associated permissions
 * 4. Generates access and refresh tokens upon successful authentication
 * 5. Sets refresh token cookie and returns access token
 * 
 * @param {Object} req - Express request object containing login credentials
 *                      req.body.email - User's email address
 *                      req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with authentication status and access token
 *                   or error message if authentication fails
 * 
 * @throws {Error} When database operations fail or token generation fails
 */
exports.Login = async (req, res) => {
    // Extract email, password and remember_me from request body
    const { email, password, remember_me } = req.body;

    const ip_address = req.ip;

    try {

        // Check if IP is banned
        const failedAttempts = await FailedLoginAttempt.findOne({
            where: {
                ip_address,
                created_at: {
                    [Op.gt]: new Date(Date.now() - 15 * 60 * 1000) // Last hour
                }
            }
        });


        if (failedAttempts && failedAttempts.attempts >= 3) {
            const banTimeLeft = Math.ceil((failedAttempts.created_at.getTime() + 15 * 60 * 1000 - Date.now()) / 1000 / 60);
            return res.status(403).json({
                status: "failed",
                message: `Too many failed attempts. Please try again in ${banTimeLeft} minutes.`
            });
        }

        // Find user with the provided refresh token and include role association
        const user = await User.findOne({
            where: { email: email },
            include: [{
                association: 'role',
                attributes: ['name'],
                include: [{
                    association: 'permissions',
                    attributes: ['name'],
                    through: rolePermission
                }]
            }]
        });

        // If user not found, clear refresh token cookie and return error
        if (!user) {
            res.clearCookie("refreshToken");
            return res.status(401).json({
                status: "failed",
                message: "Invalid email or password. Please check your credentials and try again."
            });
        }

        // Return error if role not found
        if (!user.role) {
            return res.status(401).json({
                status: "failed",
                message: "Account access error. Please contact support for assistance."
            });
        }

        // Verify password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logFailedAttempt(user.id, ip_address, req.headers['user-agent']);

            return res.status(401).json({
                status: "failed",
                message: "Invalid email or password. Please check your credentials and try again."
            });
        }

        // Generate access token with user information
        const accessToken = sign(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                is_verified: user.is_verified,
                is_blocked: user.is_blocked,
                created_at: user.created_at,
                updated_at: user.updated_at,
                password: undefined
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "20s" }
        );

        // Set refresh token expiration based on remember_me
        const refreshTokenExpiration = remember_me ? "30d" : "1d";

        // Generate refresh token with same user information
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
            { expiresIn: refreshTokenExpiration }
        );

        // Set cookie expiration based on remember_me
        const cookieMaxAge = remember_me ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

        await UserSession.create({
            user_id: user.id,
            token: refreshToken,
            device_info: req.headers['user-agent'],
            ip_address: req.ip,
            expires_at: new Date(Date.now() + cookieMaxAge)
        });

        // Log login activity
        await UserActivity.create({
            user_id: user.id,
            activity_type: 'login',
            status: 'info',
            description: 'User logged in successfully',
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        // Reset failed attempts on successful login
        await FailedLoginAttempt.destroy({ where: { ip_address } });

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

        // Send access token in response
        res.status(200).json({ accessToken });

    } catch (error) {
        // Handle any errors that occur during the process
        console.error(error);
        res.status(500).json({
            status: "error",
            message: "An error occurred during login. Please try again later."
        });
    }
};
async function logFailedAttempt(user_id, ip_address, user_agent) {
    const existingAttempt = await FailedLoginAttempt.findOne({
        where: {
            ip_address,
            created_at: {
                [Op.gt]: new Date(Date.now() - 15 * 60 * 1000)
            }
        }
    });

    if (existingAttempt) {
        await existingAttempt.update({
            attempts: existingAttempt.attempts + 1
        });

        if (existingAttempt.attempts >= 3) {
            // Log suspicious activity
            await UserActivity.create({
                user_id: user_id,
                activity_type: 'ip_banned',
                status: 'warning',
                description: `IP Address ${ip_address} has been banned for 1 hour due to multiple failed login attempts`,
                ip_address,
                user_agent: user_agent
            });
        }
    } else {
        await FailedLoginAttempt.create({
            ip_address,
            attempts: 1,
            created_at: new Date()
        });
    }
}

/**
 * CheckSetup - Checks if system initial setup is required (0 users in DB)
 */
exports.CheckSetup = async (req, res) => {
    try {
        const count = await User.count();
        return res.status(200).json({
            success: true,
            setupRequired: count === 0
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Setup - Creates the initial admin/owner user during setup (only allowed if 0 users exist)
 */
exports.Setup = async (req, res) => {
    const { name, email, password, currency, language } = req.body;
    try {
        const count = await User.count();
        if (count > 0) {
            return res.status(400).json({ status: "failed", message: "Setup has already been completed." });
        }

        if (!name || !email || !password) {
            return res.status(400).json({ status: "failed", message: "Name, email, and password are required." });
        }

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
            { name: 'all_access', description: 'Has all access permissions' }
        ];

        for (const permData of defaultPermissions) {
            const [perm] = await Permission.findOrCreate({
                where: { name: permData.name },
                defaults: { description: permData.description }
            });
            await rolePermission.findOrCreate({
                where: { role_id: role.id, permission_id: perm.id }
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hash,
            role_id: role.id,
            is_verified: true
        });

        const accessToken = sign(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: role.name,
                is_verified: true,
                is_blocked: false,
                created_at: user.created_at,
                updated_at: user.updated_at
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "20s" }
        );

        const refreshToken = sign(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: role.name,
                is_verified: true,
                is_blocked: false,
                created_at: user.created_at,
                updated_at: user.updated_at
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: "30d" }
        );

        const cookieMaxAge = 30 * 24 * 60 * 60 * 1000;
        await UserSession.create({
            user_id: user.id,
            token: refreshToken,
            device_info: req.headers['user-agent'],
            ip_address: req.ip,
            expires_at: new Date(Date.now() + cookieMaxAge)
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: cookieMaxAge,
            path: "/"
        });

        return res.status(201).json({
            status: "success",
            message: "Setup completed successfully!",
            accessToken
        });
    } catch (error) {
        return res.status(500).json({ status: "failed", message: error.message });
    }
};


/**
 * Logout - Handles user logout process
 * 
 * This function manages the logout process by:
 * 1. Checking for refresh token in cookies
 * 2. Removing refresh token from user record in database
 * 3. Clearing refresh token cookie from client
 * 
 * @param {Object} req - Express request object containing cookies
 *                      req.cookies.refreshToken - User's refresh token
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with logout status
 * 
 * @throws {Error} When database operations fail
 */
exports.Logout = async (req, res) => {
    try {
        // Extract refresh token from cookies for session identification
        const refreshToken = req.cookies.refreshToken;

        // Validation: Ensure refresh token is provided
        if (!refreshToken) return res.status(401).json({ status: "failed", message: "No refresh token provided" });

        await UserSession.destroy({ where: { token: refreshToken } });

        if (process.env.NODE_ENV === 'development') {
            res.clearCookie("refreshToken", {
                path: "/",
            });
        } else {
            res.clearCookie("refreshToken", {
                domain: ".iarty.id",  // Change this sync your domain
                path: "/",
            });
        }
        // Send success response
        res.status(200).json({ status: "success", message: "Successfully logged out" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'failed', message: 'Internal server error' });
    }
};

/**
 * VerifyEmail - Handles email verification process with priority-based logic
 *
 * This function verifies a user's email using the following priority order:
 * 1. Validates the verification token from query parameters
 * 2. PRIORITAS 1: Cek jika user sudah verified (tampilkan "already_verified")
 * 3. PRIORITAS 2: Jika user belum verified, cek token expiration (tampilkan "expired_token")
 * 4. PRIORITAS 3: Jika user belum verified dan token valid, verifikasi email (tampilkan "newly_verified")
 * 5. Updates user's verification status and removes used verification token
 *
 * @param {Object} req - Express request object containing token
 *                      req.query.token - Email verification token
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with verification status and type
 *                   - {already_verified}: User sudah verified
 *                   - {expired_token}: Token expired
 *                   - {newly_verified}: Email berhasil diverifikasi
 *                   - {user_not_found}: User tidak ditemukan
 *                   - {server_error}: Error server
 *
 * @throws {Error} When database operations fail
 */
exports.VerifyEmail = async (req, res) => {
    // Extract token from query parameters
    const { token } = req.query;

    try {
        // Find verification token in database
        const verificationToken = await VerificationToken.findOne({ where: { token } });

        // If token doesn't exist, show expired token message
        if (!verificationToken) {
            return res.status(400).json({
                status: 'error',
                message: 'Expired or invalid token',
                type: 'expired_token'
            });
        }

        // Find the user associated with the verification token
        const user = await User.findOne({
            where: { id: verificationToken.user_id },
            attributes: ['id', 'is_verified', 'email']
        });

        // Check if user exists
        if (!user) {
            await VerificationToken.destroy({ where: { token } });
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
                type: 'user_not_found'
            });
        }

        // PRIORITAS 1: Cek jika user sudah verified
        if (user.is_verified) {
            // Remove the token since user is already verified
            await VerificationToken.destroy({ where: { token } });
            return res.status(200).json({
                status: 'success',
                message: 'Your email is already verified',
                type: 'already_verified'
            });
        }

        // PRIORITAS 2: Cek jika token expired (hanya jika user belum verified)
        if (verificationToken.expires_at < new Date()) {
            // Remove expired token
            await VerificationToken.destroy({ where: { token } });
            return res.status(400).json({
                status: 'error',
                message: 'Expired token',
                type: 'expired_token'
            });
        }

        // PRIORITAS 3: Jika user belum verified dan token valid, verifikasi email
        await User.update({ is_verified: true }, { where: { id: verificationToken.user_id } });

        // Remove used verification token
        await VerificationToken.destroy({ where: { token } });

        // Send success response for newly verified email
        res.status(200).json({
            status: 'success',
            message: 'Email verified successfully',
            type: 'newly_verified'
        });
    } catch (error) {
        // Handle any errors during the process
        res.status(500).json({
            status: 'error',
            message: error.message,
            type: 'server_error'
        });
    }
};

/**
 * ResendEmailVerification - Handles resending of email verification tokens
 * 
 * This function manages the process of resending verification emails by:
 * 1. Validating user authentication via refresh token
 * 2. Checking if user exists and needs verification
 * 3. Implementing rate limiting for verification requests
 * 4. Generating and storing new verification tokens
 * 5. Sending verification emails
 * 
 * @param {Object} req - Express request object containing refresh token in cookies
 *                      req.cookies.refreshToken - User's refresh token
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with verification status and timing information
 * 
 * @throws {Error} When database operations fail or email sending fails
 */
exports.ResendEmailVerification = async (req, res) => {
    // Extract refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ status: "failed", message: "No refresh token provided" });

    try {
        // Find user with the provided refresh token
        const session = await UserSession.findOne({
            where: { token: refreshToken },
        });
        const user = await User.findByPk(session.user_id)

        // Return error if user not found
        if (!user) {
            return res.status(404).json({
                status: 'failed',
                message: 'User not found!'
            });
        }

        // Check if user's email is already verified
        if (user.is_verified) {
            return res.status(400).json({
                status: 'failed',
                message: 'Email is already verified!'
            });
        }

        // Check for existing verification token
        const verificationToken = await VerificationToken.findOne({ where: { user_id: user.id } });

        // Handle rate limiting if token exists
        if (verificationToken) {
            const now = new Date();
            const tokenCreatedAt = new Date(verificationToken.created_at);
            const timeDiff = (now - tokenCreatedAt) / 1000; // Convert to seconds

            // Enforce 60-second cooldown between requests
            if (timeDiff < 60) {
                return res.status(400).json({
                    status: 'failed',
                    time: Math.ceil(60 - timeDiff)
                });
            }

            // Delete the old token if it exists
            await VerificationToken.destroy({ where: { user_id: user.id } });
        }

        // Generate a new verification token
        const token = crypto.randomBytes(32).toString('hex');
        const expires_at = new Date(Date.now() + 3600000); // Token expires in 1 hour

        // Save new verification token
        await VerificationToken.create({ user_id: user.id, token, expires_at });

        // Send verification email
        await SendVerificationEmail(user.email, token);

        // Return success response
        res.status(200).json({
            status: 'success',
            message: 'Email verification sent!'
        });
    } catch (error) {
        // Handle any errors during the process
        res.status(500).json({
            status: 'failed',
            message: error.message
        });
    }
};

/**
 * RequestPasswordReset - Handles password reset request process
 * 
 * This function manages the password reset request flow by:
 * 1. Validating user email exists in the system
 * 2. Checking for existing reset tokens to prevent spam
 * 3. Implementing rate limiting for reset requests
 * 4. Generating and storing new reset tokens
 * 5. Sending reset password emails
 * 
 * @param {Object} req - Express request object containing email
 *                      req.body.email - User's email address
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with request status and timing information
 * 
 * @throws {Error} When database operations fail or email sending fails
 */
exports.RequestPasswordReset = async (req, res) => {
    // Extract email from request body
    const { email } = req.body;

    try {
        // Find user by email in database
        const user = await User.findOne({ where: { email } });

        // Return error if user not found
        if (!user) {
            return res.status(404).json({
                status: 'failed',
                message: 'Email has not been registered!'
            });
        }

        // Check if user already has a reset token
        const existingToken = await ResetPasswordToken.findOne({
            where: { user_id: user.id }
        });

        // Set cooldown period for reset requests
        const resendTimeDuration = 60; // Resend time duration in seconds

        // Handle existing token cases
        if (existingToken) {
            // Calculate time elapsed since last request
            const now = new Date();
            const tokenCreatedAt = new Date(existingToken.created_at);
            const timeDiff = (now - tokenCreatedAt) / 1000; // Convert to seconds

            // Enforce cooldown period
            if (timeDiff < resendTimeDuration) {
                return res.status(400).json({
                    status: 'failed',
                    time: Math.ceil(resendTimeDuration - timeDiff)
                });
            }

            // Delete expired token
            await ResetPasswordToken.destroy({ where: { user_id: user.id } });
        }

        // Generate new reset token
        const token = crypto.randomBytes(32).toString('hex');
        const expires_at = new Date(Date.now() + 3600000); // Token expires in 1 hour

        // Save new reset token to database
        await ResetPasswordToken.create({ user_id: user.id, token, expires_at });

        // Send reset password email to user
        await SendResetPasswordEmail(user.email, token);

        // Return success response
        res.status(200).json({
            status: 'success',
            message: 'An email to reset your password has been sent!',
            time: resendTimeDuration
        });
    } catch (error) {
        // Handle any errors during the process
        res.status(500).json({ message: error.message });
    }
};

/**
 * ResetPassword - Endpoint to reset the user's password using a valid reset token.
 *
 * This endpoint allows the user to reset their password by providing a valid
 * password reset token and a new password. The function first verifies the
 * validity and expiration of the provided reset token, then checks for the
 * corresponding user. If everything is valid, it hashes the new password,
 * updates the user's password in the database, and deletes the used reset token.
 *
 * @param {Object} req - The request object, which contains the token and the new password in the body.
 * @param {Object} res - The response object, used to send responses back to the client.
 */
exports.ResetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // Look for the reset token in the database
        const resetToken = await ResetPasswordToken.findOne({ where: { token } });

        // If the token does not exist, respond with an error
        if (!resetToken) {
            return res.status(400).json({
                status: 'failed',
                message: 'Invalid token!' // Token not found message
            });
        }

        // Check if the token has expired
        if (resetToken.expires_at < new Date()) {
            // Delete the expired token from the database
            await ResetPasswordToken.destroy({ where: { token } });
            return res.status(400).json({
                status: 'failed',
                message: 'Token has expired!' // Token expiration message
            });
        }

        // Find the user associated with the reset token
        const user = await User.findOne({ where: { id: resetToken.user_id } });
        // If the user does not exist, respond with an error
        if (!user) {
            return res.status(404).json({
                status: 'failed',
                message: 'User not found!' // User not found message
            });
        }

        // Hash the new password with a cost factor of 12
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update the user's password in the database
        await User.update({ password: hashedPassword, last_password_change: new Date() }, { where: { id: user.id } });

        // Log password reset activity
        await UserActivity.create({
            user_id: user.id,
            activity_type: 'password_reset',
            status: 'info',
            description: 'User reset their password',
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        // Remove the used reset token from the database
        await ResetPasswordToken.destroy({ where: { id: resetToken.id } });

        // Respond with success message
        res.status(200).json({
            status: 'success',
            message: 'Password reset successfully!' // Successful password reset message
        });
    } catch (error) {
        // Handle any unexpected errors that occur during the process
        res.status(500).json({
            status: 'failed',
            message: error.message // Error message if an exception occurs
        });
    }
};

/**
 * CheckResetPasswordToken - Middleware to verify the validity of a password reset token.
 *
 * This endpoint checks if the provided reset token is valid and has not expired.
 * The function retrieves the token from the query parameters and queries the database
 * to find the corresponding record for that token. If the token is found and not expired,
 * it returns a success response. Otherwise, it responds with an error message.
 *
 * @param {Object} req - The request object, containing the query parameters.
 * @param {Object} res - The response object, used to send responses back to the client.
 */
exports.CheckResetPasswordToken = async (req, res) => {
    // Extract the token from query parameters
    const { token } = req.query;

    try {
        // Look for the reset token in the database
        const resetToken = await ResetPasswordToken.findOne({ where: { token } });

        // If the token does not exist, send an error response
        if (!resetToken) {
            return res.status(400).json({
                status: 'failed',
                message: 'Invalid token!' // Token not found message
            });
        }

        // If the token has expired, delete it from the database and send an error response
        if (resetToken.expires_at < new Date()) {
            await ResetPasswordToken.destroy({ where: { token } });
            return res.status(400).json({
                status: 'failed',
                message: 'Token has expired!' // Token expiration message
            });
        }

        // If the token is valid, send a success response
        res.status(200).json({
            status: 'success',
            message: 'Token is valid!' // Valid token message
        });
    } catch (error) {
        res.status(500).json({
            status: 'failed',
            message: error.message // Error message if an exception occurs
        });
    }
};

exports.GetAuthPermission = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{
                association: 'role',
                attributes: ['name'],
                include: [{
                    association: 'permissions',
                    attributes: ['name'],
                    through: rolePermission
                }]
            }]

        });

        res.status(200).json({
            status: 'success',
            permissions: user.role.permissions
        });
    } catch (error) {
        // console.log(error)
        res.status(500).json({
            status: 'failed',
            message: error.message // Error message if an exception occurs
        });
    }
}