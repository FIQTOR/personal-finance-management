const budgetService = require('../services/budgetService');

class BudgetController {
  async getBudgets(req, res) {
    try {
      const userId = req.user.id;
      const budgets = await budgetService.getAllBudgets(userId);
      return res.status(200).json({
        success: true,
        message: 'Budgets retrieved successfully',
        data: budgets
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve budgets',
        errors: [error.message]
      });
    }
  }

  async getBudget(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const budget = await budgetService.getBudgetById(id, userId);

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found',
          errors: ['Budget with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Budget retrieved successfully',
        data: budget
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve budget',
        errors: [error.message]
      });
    }
  }

  async createBudget(req, res) {
    try {
      const userId = req.user.id;
      const budget = await budgetService.createBudget(userId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        data: budget
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create budget',
        errors: [error.message]
      });
    }
  }

  async updateBudget(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const budget = await budgetService.updateBudget(id, userId, req.body);

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found',
          errors: ['Budget with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Budget updated successfully',
        data: budget
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update budget',
        errors: [error.message]
      });
    }
  }

  async deleteBudget(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const deleted = await budgetService.deleteBudget(id, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found',
          errors: ['Budget with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Budget deleted successfully',
        data: { id: Number(id) }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete budget',
        errors: [error.message]
      });
    }
  }
}

module.exports = new BudgetController();
