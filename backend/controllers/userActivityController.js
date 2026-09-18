const { Op } = require('sequelize');
const User = require('../models/user');
const UserActivity = require('../models/userActivity');
const UserSession = require('../models/userSession');

// Log a new user activity
const logActivity = async (req, res) => {
    try {
        const { user_id, activity_type, status, description } = req.body;

        const activity = await UserActivity.create({
            user_id,
            activity_type,
            status,
            description,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        return res.status(201).json({
            success: true,
            data: activity
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to log activity',
            error: error.message
        });
    }
};

// Get all activities for a specific user
const getUserActivities = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { page = 1, limit = 10, start_date, end_date } = req.query;

        const whereClause = {
            user_id
        };

        if (start_date && end_date) {
            whereClause.created_at = {
                [Op.between]: [new Date(start_date), new Date(end_date).setHours(23, 59, 59, 999)]
            };
        }

        const activities = await UserActivity.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            order: [['created_at', 'DESC']],
            include: [{
                association: 'user',
                attributes: ['id', 'name', 'email']
            }]
        });

        return res.status(200).json({
            success: true,
            data: activities.rows,
            pagination: {
                total: activities.count,
                page: parseInt(page),
                pages: Math.ceil(activities.count / parseInt(limit))
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user activities',
            error: error.message
        });
    }
};

// Get activity by ID
const getActivityById = async (req, res) => {
    try {
        const { id } = req.params;

        const activity = await UserActivity.findByPk(id, {
            include: [{
                association: 'user',
                attributes: ['id', 'name', 'email']
            }]
        });

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: activity
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch activity',
            error: error.message
        });
    }
};

// Get activities from refresh token
const getMyActivities = async (req, res) => {
    const { showAll = false } = req.query;
    try {
        const user = await User.findByPk(req.user.id);

        const { page = 1, limit = 10, start_date, end_date } = req.query;

        let whereClause;
        if (showAll === 'true') {
            whereClause = {
                user_id: user.id
            };
        } else {
            whereClause = {
                user_id: user.id,
                is_general: true
            };
        }

        if (start_date && end_date) {
            whereClause.created_at = {
                [Op.between]: [new Date(start_date), new Date(end_date).setHours(23, 59, 59, 999)]
            };
        }

        const activities = await UserActivity.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            order: [['created_at', 'DESC']],
            include: [{
                association: 'user',
                attributes: ['id', 'name', 'email']
            }]
        });

        return res.status(200).json({
            success: true,
            data: activities.rows,
            pagination: {
                total: activities.count,
                page: parseInt(page),
                pages: Math.ceil(activities.count / parseInt(limit))
            }
        });
    } catch (error) {
        console.log(error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch activities',
            error: error.message
        });
    }
};


// Delete activity (if needed)
const deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;

        const activity = await UserActivity.findByPk(id);
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        await activity.destroy();

        return res.status(200).json({
            success: true,
            message: 'Activity deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete activity',
            error: error.message
        });
    }
};


// Export controller functions and upload middleware
module.exports = {
    logActivity,
    getUserActivities,
    getActivityById,
    getMyActivities,
    deleteActivity
};
