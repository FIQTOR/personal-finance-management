const Goal = require('../models/goal');

class GoalService {
  async getAllGoals(userId) {
    return await Goal.findAll({
      where: { user_id: userId },
      order: [['deadline', 'ASC']]
    });
  }

  async getGoalById(id, userId) {
    return await Goal.findOne({
      where: { id, user_id: userId }
    });
  }

  async createGoal(userId, data) {
    const { name, target_amount, current_amount, currency, deadline } = data;
    return await Goal.create({
      user_id: userId,
      name,
      target_amount,
      current_amount: current_amount || 0.00,
      currency: currency || 'USD',
      deadline
    });
  }

  async updateGoal(id, userId, data) {
    const goal = await this.getGoalById(id, userId);
    if (!goal) return null;

    const { name, target_amount, current_amount, currency, deadline } = data;
    await goal.update({
      name: name ?? goal.name,
      target_amount: target_amount ?? goal.target_amount,
      current_amount: current_amount ?? goal.current_amount,
      currency: currency ?? goal.currency,
      deadline: deadline ?? goal.deadline
    });
    return goal;
  }

  async deleteGoal(id, userId) {
    const goal = await this.getGoalById(id, userId);
    if (!goal) return false;
    await goal.destroy();
    return true;
  }
}

module.exports = new GoalService();
