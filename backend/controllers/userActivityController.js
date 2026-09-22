// User activity controller.
const { Op } = require('sequelize');
const User = require('../models/user');
const UserActivity = require('../models/userActivity');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');
const activityService = require('../services/activityService');

const buildDateFilter = (start_date, end_date) => {
    if (!start_date || !end_date) return undefined;
    const end = new Date(end_date);
    end.setHours(23, 59, 59, 999);
    return { [Op.between]: [new Date(start_date), end] };
};

/** Log a new activity (internal / admin use). */
const logActivity = asyncHandler(async (req, res) => {
    const { user_id, activity_type, status, description } = req.body;

    const activity = await activityService.logActivity(req, {
        userId: user_id,
        activityType: activity_type,
        status,
        description,
    });

    return success(res, { statusCode: 201, message: 'Activity logged successfully', data: activity });
});

/** Get all activities for a specific user. */
const getUserActivities = asyncHandler(async (req, res) => {
    const { user_id } = req.params;
    const { page = 1, limit = 10, start_date, end_date } = req.query;

    const whereClause = { user_id };
    const dateFilter = buildDateFilter(start_date, end_date);
    if (dateFilter) whereClause.created_at = dateFilter;

    const activities = await UserActivity.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['created_at', 'DESC']],
        include: [{ association: 'user', attributes: ['id', 'name', 'email'] }],
    });

    return success(res, {
        message: 'User activities retrieved successfully',
        data: {
            activities: activities.rows,
            pagination: {
                total: activities.count,
                page: Number(page),
                pages: Math.ceil(activities.count / Number(limit)),
            },
        },
    });
});

/** Get an activity by id. */
const getActivityById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const activity = await UserActivity.findByPk(id, {
        include: [{ association: 'user', attributes: ['id', 'name', 'email'] }],
    });

    if (!activity) {
        throw new AppError('Activity not found', 404, { code: 'ACTIVITY_NOT_FOUND' });
    }

    return success(res, { message: 'Activity retrieved successfully', data: activity });
});

/** Get the authenticated user's activities. */
const getMyActivities = asyncHandler(async (req, res) => {
    const { showAll = false, page = 1, limit = 10, start_date, end_date } = req.query;

    const user = await User.findByPk(req.user.id);
    if (!user) {
        throw new AppError('User not found', 404, { code: 'USER_NOT_FOUND' });
    }

    const whereClause = { user_id: user.id };
    if (showAll !== 'true') whereClause.is_general = true;

    const dateFilter = buildDateFilter(start_date, end_date);
    if (dateFilter) whereClause.created_at = dateFilter;

    const activities = await UserActivity.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['created_at', 'DESC']],
        include: [{ association: 'user', attributes: ['id', 'name', 'email'] }],
    });

    return success(res, {
        message: 'Activities retrieved successfully',
        data: {
            activities: activities.rows,
            pagination: {
                total: activities.count,
                page: Number(page),
                pages: Math.ceil(activities.count / Number(limit)),
            },
        },
    });
});

/** Delete an activity. */
const deleteActivity = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const activity = await UserActivity.findByPk(id);
    if (!activity) {
        throw new AppError('Activity not found', 404, { code: 'ACTIVITY_NOT_FOUND' });
    }

    await activity.destroy();

    return success(res, { message: 'Activity deleted successfully' });
});

module.exports = {
    logActivity,
    getUserActivities,
    getActivityById,
    getMyActivities,
    deleteActivity,
};
