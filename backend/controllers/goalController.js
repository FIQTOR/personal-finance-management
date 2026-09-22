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

module.exports = {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal
};
