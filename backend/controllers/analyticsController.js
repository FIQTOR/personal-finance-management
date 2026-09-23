const User = require("../models/user");
const UserActivity = require("../models/userActivity");
const Role = require("../models/role");
const { Op } = require("sequelize");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");

const models = require("../models");

const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
const escapeSql = (val) => {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
};

/**
 * Export the whole database in sql | csv | json format.
 * @param {Object} req - Express request object (`?format=`)
 * @param {Object} res - Express response object
 */
const exportDatabase = asyncHandler(async (req, res) => {
    const formatType = (req.query.format || 'sql').toLowerCase();
    const modelsMap = {
        users: models.User,
        roles: models.Role,
        permissions: models.Permission,
        role_permissions: models.RolePermission,
        user_sessions: models.UserSession,
        user_activities: models.UserActivity,
        failed_login_attempts: models.FailedLoginAttempt,
        reset_password_tokens: models.ResetPasswordToken,
        verification_tokens: models.VerificationToken,
        categories: models.Category,
        transactions: models.Transaction,
        budgets: models.Budget,
        goals: models.Goal,
        app_settings: models.AppSetting
    };

    const dbTables = {};
    for (const [key, model] of Object.entries(modelsMap)) {
        dbTables[key] = model && model.findAll ? await model.findAll({ raw: true }) : [];
    }

    if (formatType === 'sql') {
        let sql = `-- DATABASE EXPORT\n-- Exported At: ${new Date().toISOString()}\n\n`;
        for (const [table, rows] of Object.entries(dbTables)) {
            if (!rows || rows.length === 0) continue;
            const cols = Object.keys(rows[0]);
            const colList = cols.map((c) => `\`${c}\``).join(', ');
            rows.forEach((row) => {
                const values = cols.map((c) => escapeSql(row[c])).join(', ');
                sql += `INSERT INTO \`${table}\` (${colList}) VALUES (${values});\n`;
            });
            sql += '\n';
        }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="database_export.sql"');
        return res.send(sql);
    }

    if (formatType === 'csv') {
        let csv = '';
        for (const [table, rows] of Object.entries(dbTables)) {
            csv += `# TABLE: ${table}\n`;
            if (!rows || rows.length === 0) { csv += '\n'; continue; }
            const cols = Object.keys(rows[0]);
            csv += cols.map(escapeCsv).join(',') + '\n';
            rows.forEach((row) => { csv += cols.map((c) => escapeCsv(row[c])).join(',') + '\n'; });
            csv += '\n';
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="database_export.csv"');
        return res.send('\ufeff' + csv);
    }

    if (formatType === 'json') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="database_export.json"');
        return res.send(JSON.stringify(dbTables, null, 2));
    }

    return success(res, {
        message: 'Database export retrieved successfully',
        data: dbTables
    });
});

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
    getDashboardAnalytics,
    exportDatabase
};
