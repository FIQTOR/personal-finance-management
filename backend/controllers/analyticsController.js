const User = require("../models/user");
const UserActivity = require("../models/userActivity");
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
 * Resolve a period query value (`7d|30d|90d|1y`) into a concrete day span.
 * Accepts the legacy `timeRange` values too, for backwards compatibility.
 */
const resolvePeriodDays = (period, timeRange) => {
    const map = {
        '7d': 7, '30d': 30, '90d': 90, '1y': 365,
        '7days': 7, '14days': 14, '30days': 30, '90days': 90, '1year': 365,
    };
    return map[period] || map[timeRange] || 30;
};

/**
 * Dashboard analytics (finance-oriented + system user metrics).
 *
 * Returns a `summary` block, `monthlyTrends`, `expensesByCategory`,
 * `recentActivities` and a `users` block. Scoped to the authenticated user for
 * all finance data; user metrics are global (admin dashboard).
 *
 * @param {Object} req - `?period=7d|30d|90d|1y` (or legacy `?timeRange=`)
 * @param {Object} res
 */
const getDashboardAnalytics = asyncHandler(async (req, res) => {
    const { period = '30d', timeRange } = req.query;
    const now = new Date();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    const daysToSubtract = resolvePeriodDays(period, timeRange);
    const periodStart = new Date(now - daysToSubtract * 24 * 60 * 60 * 1000);

    const userId = req.user.id;

    // ---- System user metrics (admin) ----
    const totalUsers = await User.count();
    const activeUsers = await UserActivity.count({
        distinct: true,
        col: 'user_id',
        where: { created_at: { [Op.gte]: last24Hours } },
    });
    const blockedUsers = await User.count({ where: { is_blocked: true } });
    const verifiedUsers = await User.count({ where: { is_verified: true } });
    const newUsersInPeriod = await User.count({ where: { created_at: { [Op.gte]: periodStart } } });
    const verificationRate = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

    // ---- Finance metrics (scoped to the current user, within the period) ----
    const transactions = await models.Transaction.findAll({
        where: { user_id: userId, date: { [Op.gte]: periodStart } },
        include: [{ association: 'category', attributes: ['id', 'name', 'color', 'type'] }],
        order: [['date', 'ASC']],
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const expensesByCategoryMap = {};
    const monthlyMap = {};

    for (const t of transactions) {
        const amount = Number(t.amount);
        const monthKey = String(t.date).slice(0, 7); // YYYY-MM
        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { income: 0, expense: 0 };

        if (t.type === 'income') {
            totalIncome += amount;
            monthlyMap[monthKey].income += amount;
        } else {
            totalExpense += amount;
            monthlyMap[monthKey].expense += amount;
            const catName = t.category?.name || 'Uncategorized';
            expensesByCategoryMap[catName] = (expensesByCategoryMap[catName] || 0) + amount;
        }
    }

    const budgets = await models.Budget.findAll({
        where: { user_id: userId, end_date: { [Op.gte]: periodStart } },
    });
    const totalBudgetLimit = budgets.reduce((acc, b) => acc + Number(b.limit_amount), 0);
    const budgetSpent = budgets.reduce((acc, b) => {
        const spent = transactions
            .filter((t) => t.category_id === b.category_id && t.type === 'expense')
            .reduce((s, t) => s + Number(t.amount), 0);
        return acc + spent;
    }, 0);
    const budgetUsagePercent = totalBudgetLimit > 0
        ? Math.min(Math.round((budgetSpent / totalBudgetLimit) * 100), 100)
        : 0;

    const goals = await models.Goal.findAll({ where: { user_id: userId } });
    const currentSavedAmount = goals.reduce((acc, g) => acc + Number(g.current_amount), 0);
    const totalTargetSavings = goals.reduce((acc, g) => acc + Number(g.target_amount), 0);

    const monthlyTrends = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({
            month: new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en', { month: 'short', year: 'numeric' }),
            income: Math.round(v.income * 100) / 100,
            expense: Math.round(v.expense * 100) / 100,
        }));

    // ---- Recent activity logs (scoped to the user) ----
    const recentActivities = await UserActivity.findAll({
        where: { user_id: userId },
        include: [{ association: 'user', attributes: ['id', 'name'] }],
        order: [['created_at', 'DESC']],
        limit: 8,
    });

    return success(res, {
        message: 'Dashboard analytics retrieved successfully',
        data: {
            summary: {
                totalIncome: Math.round(totalIncome * 100) / 100,
                totalExpense: Math.round(totalExpense * 100) / 100,
                netBalance: Math.round((totalIncome - totalExpense) * 100) / 100,
                budgetUsagePercent,
                totalBudgetLimit,
                currentSavedAmount,
                totalTargetSavings,
                totalUsers,
            },
            monthlyTrends,
            expensesByCategory: expensesByCategoryMap,
            recentActivities: recentActivities.map((a) => ({
                id: a.id,
                activity_type: a.activity_type,
                description: a.description,
                created_at: a.created_at,
                user: a.user ? { name: a.user.name } : null,
            })),
            users: {
                total: totalUsers,
                active: activeUsers,
                blocked: blockedUsers,
                verified: verifiedUsers,
                newInPeriod: newUsersInPeriod,
                verificationRate,
            },
        },
    });
});

module.exports = {
    getDashboardAnalytics,
    exportDatabase
};
