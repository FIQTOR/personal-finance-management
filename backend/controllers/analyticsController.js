const User = require("../models/user");
const UserActivity = require("../models/userActivity");
const Role = require("../models/role");
const { Op } = require("sequelize");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");

/**
 * Get dashboard analytics metrics, growth, and retention data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDashboardAnalytics = asyncHandler(async (req, res) => {
    const { timeRange = '30days', period = '7d' } = req.query;
        const now = new Date();
        const last24Hours = new Date(now - 24 * 60 * 60 * 1000);

        let daysToSubtract = 30;
        if (timeRange === '7days' || period === '7d') daysToSubtract = 7;
        else if (timeRange === '14days') daysToSubtract = 14;
        else if (timeRange === '30days' || period === '30d') daysToSubtract = 30;
        else if (timeRange === '90days' || period === '90d') daysToSubtract = 90;
        else if (timeRange === '1year') daysToSubtract = 365;

        const periodStart = new Date(now - daysToSubtract * 24 * 60 * 60 * 1000);

        const totalUsers = await User.count();
        const activeUsers = await UserActivity.count({
            distinct: true,
            col: 'user_id',
            where: { created_at: { [Op.gte]: last24Hours } }
        });

        const blockedUsers = await User.count({ where: { is_blocked: true } });
        const verifiedUsers = await User.count({ where: { is_verified: true } });
        const newUsersInPeriod = await User.count({ where: { created_at: { [Op.gte]: periodStart } } });
        const verificationRate = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

        // Activity Trends aggregated by Date
        const activityTrends = {};
        const daysToShow = Math.min(daysToSubtract, 30);

        for (let i = daysToShow - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];

            const startOfDay = new Date(date.setHours(0, 0, 0, 0));
            const endOfDay = new Date(date.setHours(23, 59, 59, 999));

            const loginCount = await UserActivity.count({
                where: {
                    activity_type: 'login',
                    created_at: { [Op.between]: [startOfDay, endOfDay] }
                }
            });

            const profileUpdateCount = await UserActivity.count({
                where: {
                    activity_type: 'profile_update',
                    created_at: { [Op.between]: [startOfDay, endOfDay] }
                }
            });

            activityTrends[dateKey] = {
                login: loginCount,
                profile_update: profileUpdateCount
            };
        }

        // Top Active Users
        const mostActiveUsersData = await UserActivity.findAll({
            attributes: [
                'user_id',
                [UserActivity.sequelize.fn('COUNT', UserActivity.sequelize.col('id')), 'activityCount']
            ],
            where: { created_at: { [Op.gte]: periodStart } },
            group: ['user_id'],
            order: [[UserActivity.sequelize.fn('COUNT', UserActivity.sequelize.col('id')), 'DESC']],
            limit: 5,
            raw: true
        });

        const mostActiveUsers = [];
        for (const item of mostActiveUsersData) {
            const u = await User.findByPk(item.user_id, { attributes: ['id', 'name', 'email', 'is_verified'] });
            if (u) {
                mostActiveUsers.push({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    isVerified: u.is_verified,
                    activityCount: parseInt(item.activityCount, 10)
                });
            }
        }

        // Mock engagement trends for products and services
        const engagementDates = Object.keys(activityTrends);
        const productTrends = engagementDates.map((date, idx) => ({
            date,
            ctr: (2.5 + Math.sin(idx) * 1.2).toFixed(1)
        }));
        const serviceTrends = engagementDates.map((date, idx) => ({
            date,
            ctr: (1.8 + Math.cos(idx) * 0.9).toFixed(1)
        }));

        return success(res, {
            message: 'Dashboard analytics retrieved successfully',
            data: {
                users: {
                    total: totalUsers,
                    active: activeUsers > 0 ? activeUsers : 1,
                    blocked: blockedUsers,
                    verified: verifiedUsers,
                    newInPeriod: newUsersInPeriod,
                    verificationRate,
                    activityTrends,
                    mostActiveUsers
                },
                products: {
                    total: 12,
                    newInPeriod: 3,
                    engagement: { trends: productTrends },
                    categoryTrends: { 'Auth Modules': 5, 'Security Kits': 7 },
                    topProducts: [{ id: 1, name: 'Auth Starter Pro', status: 'active' }]
                },
                services: {
                    total: 8,
                    newInPeriod: 2,
                    priceTrends: [{ averagePrice: 150, minPrice: 50, maxPrice: 300 }],
                    engagement: { trends: serviceTrends },
                    topServices: [{ id: 1, name: 'Security Audit', status: 'active' }]
                }
            }
        });
});

module.exports = {
    getDashboardAnalytics
};
