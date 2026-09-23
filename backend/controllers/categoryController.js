// Category management controller.
const categoryService = require('../services/categoryService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

/** List the authenticated user's categories. */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getAllCategories(req.user.id);
  return success(res, {
    message: 'Categories retrieved successfully',
    data: categories
  });
});

/** Get a single category owned by the authenticated user. */
const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await categoryService.getCategoryById(id, req.user.id);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return success(res, {
    message: 'Category retrieved successfully',
    data: category
  });
});

/** Create a new category. */
const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.user.id, req.body);
  return success(res, {
    statusCode: 201,
    message: 'Category created successfully',
    data: category
  });
});

/** Update an existing category. */
const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await categoryService.updateCategory(id, req.user.id, req.body);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return success(res, {
    message: 'Category updated successfully',
    data: category
  });
});

/** Delete a category. */
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await categoryService.deleteCategory(id, req.user.id);
  if (!deleted) {
    throw new AppError('Category not found', 404);
  }
  return success(res, {
    message: 'Category deleted successfully',
    data: { id: Number(id) }
  });
});

/** Bulk insert categories from a parsed list. */
const createBulkCategories = asyncHandler(async (req, res) => {
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
      const item = await categoryService.createCategory(req.user.id, row);
      created.push(item);
    } catch (err) {
      errors.push({ row: i + 1, name: row.name || '-', message: err.message || 'Failed to create category' });
    }
  }
  return success(res, {
    statusCode: 201,
    message: `Bulk insert finished: ${created.length} created, ${errors.length} failed`,
    data: { createdCount: created.length, failedCount: errors.length, created, errors }
  });
});

/** Bulk delete categories owned by the authenticated user. */
const bulkDeleteCategories = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError('IDs array is required', 400);
  }
  const deletedCount = await categoryService.bulkDeleteCategories(ids, req.user.id);
  return success(res, {
    message: `${deletedCount} categories deleted`,
    data: { deletedCount }
  });
});

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  createBulkCategories,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories
};
