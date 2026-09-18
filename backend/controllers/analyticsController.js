const Transaction = require("../models/transaction");
const Budget = require("../models/budget");
const Goal = require("../models/goal");
const Category = require("../models/category");
const User = require("../models/user");
const UserActivity = require("../models/userActivity");
const { Op } = require("sequelize");

/**
 * Get Personal Finance Analytics & Metrics for Panel Dashboard
 */
const getDashboardAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;

        const transactions = await Transaction.findAll({
            where: { user_id: userId },
            include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'type'] }],
            order: [['date', 'DESC']]
        });

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const netBalance = totalIncome - totalExpense;

        const budgets = await Budget.findAll({
            where: { user_id: userId },
            include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color'] }]
        });

        const totalBudgetLimit = budgets.reduce((sum, b) => sum + Number(b.limit_amount), 0);
        const budgetSpent = budgets.reduce((acc, b) => {
            if (!b.category_id) return acc;
            const spent = transactions
                .filter(t => t.category_id === b.category_id && t.type === 'expense')
                .reduce((s, t) => s + Number(t.amount), 0);
            return acc + spent;
        }, 0);

        const goals = await Goal.findAll({ where: { user_id: userId } });
        const totalTargetSavings = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
        const currentSavedAmount = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);

        // Aggregate Expenses by Category
        const categoryMap = {};
        transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const catName = t.category ? t.category.name : 'Uncategorized';
                categoryMap[catName] = (categoryMap[catName] || 0) + Number(t.amount);
            });

        // Monthly trends (last 6 months)
        const monthlyTrends = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStr = d.toISOString().slice(0, 7); // YYYY-MM

            const monthIncome = transactions
                .filter(t => t.date && t.date.startsWith(monthStr) && t.type === 'income')
                .reduce((s, t) => s + Number(t.amount), 0);

            const monthExpense = transactions
                .filter(t => t.date && t.date.startsWith(monthStr) && t.type === 'expense')
                .reduce((s, t) => s + Number(t.amount), 0);

            monthlyTrends.push({
                month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
                income: monthIncome,
                expense: monthExpense
            });
        }

        const totalUsers = await User.count();
        const recentActivities = await UserActivity.findAll({
            limit: 6,
            order: [['created_at', 'DESC']],
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
        });

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalIncome,
                    totalExpense,
                    netBalance,
                    totalBudgetLimit,
                    budgetSpent,
                    budgetUsagePercent: totalBudgetLimit > 0 ? Math.min(Math.round((budgetSpent / totalBudgetLimit) * 100), 100) : 0,
                    totalTargetSavings,
                    currentSavedAmount,
                    goalsCount: goals.length,
                    transactionCount: transactions.length,
                    totalUsers
                },
                monthlyTrends,
                expensesByCategory: categoryMap,
                budgets,
                goals,
                recentTransactions: transactions.slice(0, 5),
                recentActivities
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getDashboardAnalytics
};
