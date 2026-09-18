const goalService = require('../services/goalService');

class GoalController {
  async getGoals(req, res) {
    try {
      const userId = req.user.id;
      const goals = await goalService.getAllGoals(userId);
      return res.status(200).json({
        success: true,
        message: 'Goals retrieved successfully',
        data: goals
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve goals',
        errors: [error.message]
      });
    }
  }

  async getGoal(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const goal = await goalService.getGoalById(id, userId);

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found',
          errors: ['Goal with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Goal retrieved successfully',
        data: goal
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve goal',
        errors: [error.message]
      });
    }
  }

  async createGoal(req, res) {
    try {
      const userId = req.user.id;
      const goal = await goalService.createGoal(userId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        data: goal
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create goal',
        errors: [error.message]
      });
    }
  }

  async updateGoal(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const goal = await goalService.updateGoal(id, userId, req.body);

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found',
          errors: ['Goal with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Goal updated successfully',
        data: goal
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update goal',
        errors: [error.message]
      });
    }
  }

  async deleteGoal(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const deleted = await goalService.deleteGoal(id, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found',
          errors: ['Goal with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Goal deleted successfully',
        data: { id: Number(id) }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete goal',
        errors: [error.message]
      });
    }
  }
}

module.exports = new GoalController();
