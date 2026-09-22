const jwt = require('jsonwebtoken');
const User = require('../models/user');
const RolePermission = require('../models/rolePermission');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Authentication middleware.
 * Verifies the Bearer access token, loads the user with role & permissions,
 * and rejects blocked or deleted accounts.
 */
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token =
            authHeader && authHeader.startsWith('Bearer ')
                ? authHeader.slice(7)
                : null;

        if (!token) {
            throw new AppError('Authentication token is required', 401, { code: 'TOKEN_REQUIRED' });
        }

        const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

        const user = await User.findByPk(decoded.id, {
            include: [{
                association: 'role',
                include: [{
                    association: 'permissions',
                    through: RolePermission,
                }],
            }],
        });

        if (!user || user.deleted_at) {
            throw new AppError('User account no longer exists', 401, { code: 'USER_NOT_FOUND' });
        }

        if (user.is_blocked) {
            throw new AppError('Your account has been suspended', 403, { code: 'ACCOUNT_BLOCKED' });
        }

        req.user = user;
        return next();
    } catch (error) {
        if (error instanceof AppError) return next(error);

        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token expired', 401, { code: 'TOKEN_EXPIRED' }));
        }
        return next(new AppError('Invalid or corrupted token', 401, { code: 'TOKEN_INVALID' }));
    }
};

module.exports = verifyToken;
