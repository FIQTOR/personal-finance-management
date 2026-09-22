/**
 * Authentication routes.
 *
 * Mounted at the API root. Public endpoints are declared per-route (not via a
 * blanket `router.use`) so unknown paths still fall through to the 404 handler.
 *
 * NOTE: Self-registration is intentionally disabled. The first (owner) account
 * is created via `POST /setup` which only works while the users table is empty.
 */
const express = require('express');
const authController = require('../controllers/authController');
const googleAuthController = require('../controllers/googleAuthController');
const userController = require('../controllers/userController');
const VerifyToken = require('../middlewares/verifyToken');
const rateLimiter = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validate');
const { authSchemas, userSchemas } = require('../validators/schemas');

const router = express.Router();

const authRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { success: false, message: 'Too many authentication attempts. Please try again later.' },
});

// First-run setup (public, guarded internally by a user-count check).
router.get('/check-setup', authController.checkSetup);
router.post('/setup', authRateLimiter, validate(authSchemas.setup), authController.setup);

// Session / token
router.get('/checkauth', authController.checkAuth);
router.get('/token', authController.refreshToken);
router.post('/signin', authRateLimiter, validate(authSchemas.login), authController.login);
router.delete('/signout', VerifyToken, authController.logout);

// Email verification
router.get('/verify-email', authController.verifyEmail);
router.get('/resend-verification-email', VerifyToken, authController.resendEmailVerification);

// Password reset
router.post('/forgot-password', authRateLimiter, validate(authSchemas.requestPasswordReset), authController.requestPasswordReset);
router.post('/reset-password', authRateLimiter, validate(authSchemas.resetPassword), authController.resetPassword);
router.get('/check-reset-password-token', authController.checkResetPasswordToken);

// Profile (self-service)
router.get('/get-auth-permissions', VerifyToken, authController.getAuthPermissions);
router.put('/profile', VerifyToken, validate(userSchemas.updateProfile), userController.updateProfile);
router.put('/profile/avatar', VerifyToken, userController.upload.single('avatar'), userController.updateProfileAvatar);

// Google OAuth
router.get('/auth/google', googleAuthController.loginWithGoogle);
router.get('/auth/google/callback', googleAuthController.googleCallback);

module.exports = router;
