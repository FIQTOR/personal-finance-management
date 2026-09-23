const Category = require('../models/category');

class CategoryService {
  async getAllCategories(userId) {
    let categories = await Category.findAll({
      where: { user_id: userId },
      order: [['name', 'ASC']]
    });

    if (categories.length === 0) {
      const defaultCategories = [
        { user_id: userId, name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#EF4444' },
        { user_id: userId, name: 'Housing & Utilities', type: 'expense', icon: 'home', color: '#F59E0B' },
        { user_id: userId, name: 'Transportation', type: 'expense', icon: 'car', color: '#6366F1' },
        { user_id: userId, name: 'Entertainment', type: 'expense', icon: 'film', color: '#EC4899' },
        { user_id: userId, name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#14B8A6' },
        { user_id: userId, name: 'Health & Fitness', type: 'expense', icon: 'activity', color: '#06B6D4' },
        { user_id: userId, name: 'Salary', type: 'income', icon: 'dollar-sign', color: '#10B981' },
        { user_id: userId, name: 'Freelance', type: 'income', icon: 'briefcase', color: '#3B82F6' },
        { user_id: userId, name: 'Investment', type: 'income', icon: 'trending-up', color: '#8B5CF6' }
      ];
      await Category.bulkCreate(defaultCategories);
      categories = await Category.findAll({
        where: { user_id: userId },
        order: [['name', 'ASC']]
      });
    }

    return categories;
  }

  async getCategoryById(id, userId) {
    return await Category.findOne({
      where: { id, user_id: userId }
    });
  }

  async createCategory(userId, data) {
    const { name, type, icon, color } = data;
    return await Category.create({
      user_id: userId,
      name,
      type,
      icon: icon || 'tag',
      color: color || '#3B82F6'
    });
  }

  async updateCategory(id, userId, data) {
    const category = await this.getCategoryById(id, userId);
    if (!category) return null;

    const { name, type, icon, color } = data;
    await category.update({
      name: name ?? category.name,
      type: type ?? category.type,
      icon: icon ?? category.icon,
      color: color ?? category.color
    });
    return category;
  }

  async deleteCategory(id, userId) {
    const category = await this.getCategoryById(id, userId);
    if (!category) return false;
    await category.destroy();
    return true;
  }

  async bulkDeleteCategories(ids, userId) {
    return await Category.destroy({ where: { id: ids, user_id: userId } });
  }
}

module.exports = new CategoryService();
