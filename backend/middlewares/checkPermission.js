const AppError = require('../utils/AppError');

/**
 * Middleware factory that checks whether the authenticated user holds the
 * required permission (or the wildcard `all_access`).
 *
 * Accepts a single permission name or an array (any-of).
 *
 * @param {string|string[]} requiredPermission
 * @returns {import('express').RequestHandler}
 */
const checkPermission = (requiredPermission) => (req, res, next) => {
    if (!req.user || !req.user.role) {
        return next(new AppError('Forbidden: Access denied', 403, { code: 'FORBIDDEN' }));
    }

    const required = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const permissions = req.user.role.permissions || [];
    const hasPermission = permissions.some(
        (p) => p.name === 'all_access' || required.includes(p.name)
    );

    if (!hasPermission) {
        return next(new AppError(
            `Forbidden: Missing required permission [${required.join(' or ')}]`,
            403,
            { code: 'MISSING_PERMISSION' }
        ));
    }

    return next();
};

module.exports = checkPermission;
