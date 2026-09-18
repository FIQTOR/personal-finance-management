/**
 * Enhanced Middleware function to check if user has the required permission
 * @param {string} requiredPermission - The permission name that needs to be checked
 */
const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.role) {
                return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
            }

            const permissions = req.user.role.permissions || [];
            const hasPermission = permissions.some(p => p.name === requiredPermission || p.name === 'all_access');

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    message: `Forbidden: Missing required permission [${requiredPermission}]`
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
    };
};

module.exports = checkPermission;
