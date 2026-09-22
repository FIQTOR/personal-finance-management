const AppError = require('../utils/AppError');

/**
 * Middleware factory that checks whether the authenticated user holds the
 * required permission (or the wildcard `all_access`).
 *
 * @param {string} requiredPermission
 * @returns {import('express').RequestHandler}
 */
const checkPermission = (requiredPermission) => (req, res, next) => {
    if (!req.user || !req.user.role) {
        return next(new AppError('Forbidden: Access denied', 403, { code: 'FORBIDDEN' }));
    }

    const permissions = req.user.role.permissions || [];
    const hasPermission = permissions.some(
        (p) => p.name === requiredPermission || p.name === 'all_access'
    );

    if (!hasPermission) {
        return next(new AppError(
            `Forbidden: Missing required permission [${requiredPermission}]`,
            403,
            { code: 'MISSING_PERMISSION' }
        ));
    }

    return next();
};

module.exports = checkPermission;
