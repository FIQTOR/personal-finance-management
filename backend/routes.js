/**
 * API Routes Configuration
 * All routes are prefixed with '/api'
 */

const express = require('express');
const userController = require('./controllers/userController');
const authController = require('./controllers/authController');
const googleAuthController = require('./controllers/googleAuthController');
const VerifyToken = require('./middlewares/verifyToken');
const checkPermission = require('./middlewares/checkPermission');
const roleController = require('./controllers/roleController');
const permissionController = require('./controllers/permissionController');
const rolePermissionController = require('./controllers/rolePermissionController');
const userActivityController = require('./controllers/userActivityController');
const analyticsController = require('./controllers/analyticsController');
const rateLimiter = require('./middlewares/rateLimiter');
const categoryController = require('./controllers/categoryController');
const transactionController = require('./controllers/transactionController');
const budgetController = require('./controllers/budgetController');
const goalController = require('./controllers/goalController');
const appSettingController = require('./controllers/appSettingController');

const apiRouter = express.Router();

const authRateLimiter = rateLimiter({ windowMs: 15 * 60 * 1000, max: 15, message: { status: 'failed', message: 'Too many authentication attempts. Please try again later.' } });

/**
 * Root endpoint
 */
apiRouter.get('/', (req, res) => {
    res.status(200).json({ message: 'Hello from FIQTOR module API v1!' });
});

/**
 * Authentication Routes
 */
apiRouter.get('/check-setup', authController.CheckSetup);
apiRouter.post('/setup', authRateLimiter, authController.Setup);
apiRouter.get('/checkauth', authController.Check);
apiRouter.get('/token', authController.RefreshToken);
apiRouter.post('/signin', authRateLimiter, authController.Login);
apiRouter.delete('/signout', VerifyToken, authController.Logout);
apiRouter.post('/forgot-password', authRateLimiter, authController.RequestPasswordReset);
apiRouter.post('/reset-password', authRateLimiter, authController.ResetPassword);
apiRouter.put('/profile', VerifyToken, userController.updateProfile);
apiRouter.put('/profile/avatar', VerifyToken, userController.upload.single('avatar'), userController.updateProfileAvatar);
apiRouter.get('/check-reset-password-token', authController.CheckResetPasswordToken);
apiRouter.get('/get-auth-permissions', VerifyToken, authController.GetAuthPermission);
apiRouter.get('/settings', appSettingController.getSettings);
apiRouter.put('/settings', VerifyToken, appSettingController.updateSettings);

/**
 * User Management Routes
 */
apiRouter.post('/users', VerifyToken, checkPermission('manage_users'), userController.upload.single('avatar'), userController.createUser);
apiRouter.get('/users', VerifyToken, checkPermission('manage_users'), userController.getUsers);
apiRouter.get('/users/:id', VerifyToken, checkPermission('manage_users'), userController.getUser);
apiRouter.put('/users/:id', VerifyToken, checkPermission('manage_users'), userController.upload.single('avatar'), userController.updateUser);
apiRouter.put('/users/:id/reset-password', VerifyToken, checkPermission('manage_users'), userController.resetUserPassword);
apiRouter.delete('/users/bulk-delete', VerifyToken, checkPermission('manage_users'), userController.bulkDeleteUsers);
apiRouter.delete('/users/:id', VerifyToken, checkPermission('manage_users'), userController.deleteUser);

/**
 * Google OAuth Routes
 */
apiRouter.get('/auth/google', googleAuthController.loginWithGoogle);
apiRouter.get('/auth/google/callback', googleAuthController.googleCallback);

/**
 * Role Management Routes
 */
apiRouter.get('/roles', VerifyToken, checkPermission('view_dashboard'), roleController.getRoles);
apiRouter.get('/roles/:id', VerifyToken, checkPermission('manage_roles'), roleController.getRole);
apiRouter.post('/roles', VerifyToken, checkPermission('manage_roles'), roleController.createRole);
apiRouter.put('/roles/:id', VerifyToken, checkPermission('manage_roles'), roleController.updateRole);
apiRouter.delete('/roles/:id', VerifyToken, checkPermission('manage_roles'), roleController.deleteRole);

/**
 * Permission Management Routes
 */
apiRouter.get('/permissions', VerifyToken, checkPermission('manage_roles'), permissionController.getPermissions);
apiRouter.get('/permissions/:id', VerifyToken, checkPermission('manage_roles'), permissionController.getPermission);
apiRouter.post('/permissions', VerifyToken, checkPermission('manage_roles'), permissionController.createPermission);
apiRouter.put('/permissions/:id', VerifyToken, checkPermission('manage_roles'), permissionController.updatePermission);
apiRouter.delete('/permissions/:id', VerifyToken, checkPermission('manage_roles'), permissionController.deletePermission);

/**
 * Role-Permission Management Routes
 */
apiRouter.get('/roles/:roleId/permissions', VerifyToken, checkPermission('manage_roles'), rolePermissionController.getRolePermissions);
apiRouter.post('/roles/:roleId/permissions', VerifyToken, checkPermission('manage_roles'), rolePermissionController.assignPermissionsToRole);
apiRouter.delete('/roles/:roleId/permissions', VerifyToken, checkPermission('manage_roles'), rolePermissionController.removePermissionsFromRole);

/**
 * User Activity Routes
 */
apiRouter.get('/users/:user_id/activities', VerifyToken, checkPermission('manage_users'), userActivityController.getUserActivities);
apiRouter.get('/activities', VerifyToken, userActivityController.getMyActivities);
apiRouter.delete('/activities/:id', VerifyToken, checkPermission('manage_users'), userActivityController.deleteActivity);

apiRouter.get('/analytics/dashboard', VerifyToken, checkPermission('view_dashboard'), analyticsController.getDashboardAnalytics);

/**
 * Personal Finance Management Routes
 */
// Categories
apiRouter.get('/categories', VerifyToken, (req, res) => categoryController.getCategories(req, res));
apiRouter.get('/categories/:id', VerifyToken, (req, res) => categoryController.getCategory(req, res));
apiRouter.post('/categories', VerifyToken, (req, res) => categoryController.createCategory(req, res));
apiRouter.put('/categories/:id', VerifyToken, (req, res) => categoryController.updateCategory(req, res));
apiRouter.delete('/categories/:id', VerifyToken, (req, res) => categoryController.deleteCategory(req, res));

// Transactions (export route registered BEFORE :id route)
apiRouter.get('/transactions/export', VerifyToken, (req, res) => transactionController.exportTransactions(req, res));
apiRouter.get('/transactions', VerifyToken, (req, res) => transactionController.getTransactions(req, res));
apiRouter.get('/transactions/:id', VerifyToken, (req, res) => transactionController.getTransaction(req, res));
apiRouter.post('/transactions', VerifyToken, (req, res) => transactionController.createTransaction(req, res));
apiRouter.put('/transactions/:id', VerifyToken, (req, res) => transactionController.updateTransaction(req, res));
apiRouter.delete('/transactions/:id', VerifyToken, (req, res) => transactionController.deleteTransaction(req, res));

// Budgets
apiRouter.get('/budgets', VerifyToken, (req, res) => budgetController.getBudgets(req, res));
apiRouter.get('/budgets/:id', VerifyToken, (req, res) => budgetController.getBudget(req, res));
apiRouter.post('/budgets', VerifyToken, (req, res) => budgetController.createBudget(req, res));
apiRouter.put('/budgets/:id', VerifyToken, (req, res) => budgetController.updateBudget(req, res));
apiRouter.delete('/budgets/:id', VerifyToken, (req, res) => budgetController.deleteBudget(req, res));

// Goals
apiRouter.get('/goals', VerifyToken, (req, res) => goalController.getGoals(req, res));
apiRouter.get('/goals/:id', VerifyToken, (req, res) => goalController.getGoal(req, res));
apiRouter.post('/goals', VerifyToken, (req, res) => goalController.createGoal(req, res));
apiRouter.put('/goals/:id', VerifyToken, (req, res) => goalController.updateGoal(req, res));
apiRouter.delete('/goals/:id', VerifyToken, (req, res) => goalController.deleteGoal(req, res));

module.exports = apiRouter;
