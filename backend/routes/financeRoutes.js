/**
 * Finance routes: categories, transactions, budgets, goals.
 *
 * All routes require authentication. Ownership is enforced at the service
 * layer (every query is scoped by `user_id`). Controllers use `asyncHandler`,
 * `AppError` and the shared `success` helper.
 *
 * NOTE: mounted at the API root, so authentication is applied per-route (not
 * via a blanket `router.use`) — unmatched paths fall through to the 404 handler.
 */
const express = require('express');
const categoryController = require('../controllers/categoryController');
const transactionController = require('../controllers/transactionController');
const budgetController = require('../controllers/budgetController');
const goalController = require('../controllers/goalController');
const VerifyToken = require('../middlewares/verifyToken');
const validate = require('../middlewares/validate');
const { financeSchemas } = require('../validators/schemas');

const router = express.Router();

// --- Categories -------------------------------------------------------------
router.get('/categories', VerifyToken, categoryController.getCategories);
router.get('/categories/:id', VerifyToken, categoryController.getCategory);
router.post('/categories', VerifyToken, validate(financeSchemas.category), categoryController.createCategory);
router.put('/categories/:id', VerifyToken, validate(financeSchemas.category), categoryController.updateCategory);
router.delete('/categories/:id', VerifyToken, categoryController.deleteCategory);

// --- Transactions (export registered BEFORE :id) ----------------------------
router.get('/transactions/export', VerifyToken, transactionController.exportTransactions);
router.get('/transactions', VerifyToken, transactionController.getTransactions);
router.get('/transactions/:id', VerifyToken, transactionController.getTransaction);
router.post('/transactions', VerifyToken, validate(financeSchemas.transaction), transactionController.createTransaction);
router.put('/transactions/:id', VerifyToken, validate(financeSchemas.transaction), transactionController.updateTransaction);
router.delete('/transactions/:id', VerifyToken, transactionController.deleteTransaction);

// --- Budgets ----------------------------------------------------------------
router.get('/budgets', VerifyToken, budgetController.getBudgets);
router.get('/budgets/:id', VerifyToken, budgetController.getBudget);
router.post('/budgets', VerifyToken, validate(financeSchemas.budget), budgetController.createBudget);
router.put('/budgets/:id', VerifyToken, validate(financeSchemas.budget), budgetController.updateBudget);
router.delete('/budgets/:id', VerifyToken, budgetController.deleteBudget);

// --- Goals ------------------------------------------------------------------
router.get('/goals', VerifyToken, goalController.getGoals);
router.get('/goals/:id', VerifyToken, goalController.getGoal);
router.post('/goals', VerifyToken, validate(financeSchemas.goal), goalController.createGoal);
router.put('/goals/:id', VerifyToken, validate(financeSchemas.goal), goalController.updateGoal);
router.delete('/goals/:id', VerifyToken, goalController.deleteGoal);

module.exports = router;
