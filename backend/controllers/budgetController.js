// Budget management controller.
const budgetService = require('../services/budgetService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

/** List the authenticated user's budget limits. */
const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await budgetService.getAllBudgets(req.user.id);
  return success(res, {
    message: 'Budgets retrieved successfully',
    data: budgets
  });
});

/** Get a single budget owned by the authenticated user. */
const getBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budget = await budgetService.getBudgetById(id, req.user.id);
  if (!budget) {
    throw new AppError('Budget not found', 404);
  }
  return success(res, {
    message: 'Budget retrieved successfully',
    data: budget
  });
});

/** Create a new budget limit. */
const createBudget = asyncHandler(async (req, res) => {
  const budget = await budgetService.createBudget(req.user.id, req.body);
  return success(res, {
    statusCode: 201,
    message: 'Budget created successfully',
    data: budget
  });
});

/** Update an existing budget limit. */
const updateBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const budget = await budgetService.updateBudget(id, req.user.id, req.body);
  if (!budget) {
    throw new AppError('Budget not found', 404);
  }
  return success(res, {
    message: 'Budget updated successfully',
    data: budget
  });
});

/** Delete a budget limit. */
const deleteBudget = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await budgetService.deleteBudget(id, req.user.id);
  if (!deleted) {
    throw new AppError('Budget not found', 404);
  }
  return success(res, {
    message: 'Budget deleted successfully',
    data: { id: Number(id) }
  });
});

module.exports = {
  getBudgets,
  getBudget,
  createBudget,
  updateBudget,
  deleteBudget
};
