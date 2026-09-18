const categoryService = require('../services/categoryService');

class CategoryController {
  async getCategories(req, res) {
    try {
      const userId = req.user.id;
      const categories = await categoryService.getAllCategories(userId);
      return res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        errors: [error.message]
      });
    }
  }

  async getCategory(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id, userId);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
          errors: ['Category with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve category',
        errors: [error.message]
      });
    }
  }

  async createCategory(req, res) {
    try {
      const userId = req.user.id;
      const category = await categoryService.createCategory(userId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create category',
        errors: [error.message]
      });
    }
  }

  async updateCategory(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const category = await categoryService.updateCategory(id, userId, req.body);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
          errors: ['Category with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update category',
        errors: [error.message]
      });
    }
  }

  async deleteCategory(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const deleted = await categoryService.deleteCategory(id, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
          errors: ['Category with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
        data: { id: Number(id) }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        errors: [error.message]
      });
    }
  }
}

module.exports = new CategoryController();
