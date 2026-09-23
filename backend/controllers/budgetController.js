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

/** Bulk insert budgets from a parsed list. */
const createBulkBudgets = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('No items provided for bulk insert', 400);
  }
  const created = [];
  const errors = [];
  for (let i = 0; i < items.length; i++) {
    const row = items[i] || {};
    try {
      if (row.limit_amount === undefined || row.limit_amount === '') throw new Error('Limit amount is required');
      if (!row.start_date || !row.end_date) throw new Error('Start date and end date are required');
      const item = await budgetService.createBudget(req.user.id, row);
      created.push(item);
    } catch (err) {
      errors.push({ row: i + 1, name: row.category_id || '-', message: err.message || 'Failed to create budget' });
    }
  }
  return success(res, {
    statusCode: 201,
    message: `Bulk insert finished: ${created.length} created, ${errors.length} failed`,
    data: { createdCount: created.length, failedCount: errors.length, created, errors }
  });
});

/** Bulk delete budgets owned by the authenticated user. */
const bulkDeleteBudgets = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError('IDs array is required', 400);
  }
  const deletedCount = await budgetService.bulkDeleteBudgets(ids, req.user.id);
  return success(res, {
    message: `${deletedCount} budgets deleted`,
    data: { deletedCount }
  });
});

module.exports = {
  getBudgets,
  getBudget,
  createBudget,
  createBulkBudgets,
  updateBudget,
  deleteBudget,
  bulkDeleteBudgets
};
