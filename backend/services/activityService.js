/**
 * Activity service
 *
 * Wraps UserActivity creation so controllers don't repeat ip/user-agent wiring.
 */
const UserActivity = require('../models/userActivity');

/**
 * Log a user activity. Failures are swallowed (logged) so activity logging can
 * never break the primary request flow.
 *
 * @param {import('express').Request} req
 * @param {object} params
 * @param {number} params.userId
 * @param {string} params.activityType
 * @param {string} [params.status='info']
 * @param {string} [params.description]
 * @param {boolean} [params.isGeneral=true]
 */
const logActivity = async (req, {
    userId,
    activityType,
    status = 'info',
    description = null,
    isGeneral = true,
} = {}) => {
    try {
        return await UserActivity.create({
            user_id: userId,
            activity_type: activityType,
            status,
            description,
            ip_address: req?.ip || null,
            user_agent: req?.headers?.['user-agent'] || null,
            is_general: isGeneral,
        });
    } catch (error) {
        // Never let logging break the request.
        // eslint-disable-next-line no-console
        console.error('Failed to log activity:', error.message);
        return null;
    }
};

module.exports = { logActivity };
