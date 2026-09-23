// Financial goal management controller.
const goalService = require('../services/goalService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

/** List the authenticated user's savings goals. */
const getGoals = asyncHandler(async (req, res) => {
  const goals = await goalService.getAllGoals(req.user.id);
  return success(res, {
    message: 'Goals retrieved successfully',
    data: goals
  });
});

/** Get a single goal owned by the authenticated user. */
const getGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const goal = await goalService.getGoalById(id, req.user.id);
  if (!goal) {
    throw new AppError('Goal not found', 404);
  }
  return success(res, {
    message: 'Goal retrieved successfully',
    data: goal
  });
});

/** Create a new savings goal. */
const createGoal = asyncHandler(async (req, res) => {
  const goal = await goalService.createGoal(req.user.id, req.body);
  return success(res, {
    statusCode: 201,
    message: 'Goal created successfully',
    data: goal
  });
});

/** Update an existing goal's progress/target. */
const updateGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const goal = await goalService.updateGoal(id, req.user.id, req.body);
  if (!goal) {
    throw new AppError('Goal not found', 404);
  }
  return success(res, {
    message: 'Goal updated successfully',
    data: goal
  });
});

/** Delete a goal. */
const deleteGoal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await goalService.deleteGoal(id, req.user.id);
  if (!deleted) {
    throw new AppError('Goal not found', 404);
  }
  return success(res, {
    message: 'Goal deleted successfully',
    data: { id: Number(id) }
  });
});

/** Bulk insert goals from a parsed list. */
const createBulkGoals = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('No items provided for bulk insert', 400);
  }
  const created = [];
  const errors = [];
  for (let i = 0; i < items.length; i++) {
    const row = items[i] || {};
    try {
      if (!row.name) throw new Error('Name is required');
      if (row.target_amount === undefined || row.target_amount === '') throw new Error('Target amount is required');
      if (!row.deadline) throw new Error('Deadline is required');
      const item = await goalService.createGoal(req.user.id, row);
      created.push(item);
    } catch (err) {
      errors.push({ row: i + 1, name: row.name || '-', message: err.message || 'Failed to create goal' });
    }
  }
  return success(res, {
    statusCode: 201,
    message: `Bulk insert finished: ${created.length} created, ${errors.length} failed`,
    data: { createdCount: created.length, failedCount: errors.length, created, errors }
  });
});

/** Bulk delete goals owned by the authenticated user. */
const bulkDeleteGoals = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError('IDs array is required', 400);
  }
  const deletedCount = await goalService.bulkDeleteGoals(ids, req.user.id);
  return success(res, {
    message: `${deletedCount} goals deleted`,
    data: { deletedCount }
  });
});

module.exports = {
  getGoals,
  getGoal,
  createGoal,
  createBulkGoals,
  updateGoal,
  deleteGoal,
  bulkDeleteGoals
};
