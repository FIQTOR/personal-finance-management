const Budget = require('../models/budget');
const Category = require('../models/category');

class BudgetService {
  async getAllBudgets(userId) {
    return await Budget.findAll({
      where: { user_id: userId },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
      order: [['start_date', 'DESC']]
    });
  }

  async getBudgetById(id, userId) {
    return await Budget.findOne({
      where: { id, user_id: userId },
      include: [{ model: Category, as: 'category' }]
    });
  }

  async createBudget(userId, data) {
    const { category_id, limit_amount, currency, start_date, end_date } = data;
    return await Budget.create({
      user_id: userId,
      category_id,
      limit_amount,
      currency: currency || 'USD',
      start_date,
      end_date
    });
  }

  async updateBudget(id, userId, data) {
    const budget = await this.getBudgetById(id, userId);
    if (!budget) return null;

    const { category_id, limit_amount, currency, start_date, end_date } = data;
    await budget.update({
      category_id: category_id ?? budget.category_id,
      limit_amount: limit_amount ?? budget.limit_amount,
      currency: currency ?? budget.currency,
      start_date: start_date ?? budget.start_date,
      end_date: end_date ?? budget.end_date
    });
    return await this.getBudgetById(id, userId);
  }

  async deleteBudget(id, userId) {
    const budget = await this.getBudgetById(id, userId);
    if (!budget) return false;
    await budget.destroy();
    return true;
  }
}

module.exports = new BudgetService();
