// Recurring transaction management controller.
const recurringTransactionService = require('../services/recurringTransactionService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

/** List the authenticated user's recurring transactions with optional filters. */
const getRecurringTransactions = asyncHandler(async (req, res) => {
  const recurringTransactions = await recurringTransactionService.getAll(req.user.id, req.query);
  return success(res, {
    message: 'Recurring transactions retrieved successfully',
    data: recurringTransactions
  });
});

/** Get a single recurring transaction owned by the authenticated user. */
const getRecurringTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const recurringTransaction = await recurringTransactionService.getById(id, req.user.id);
  if (!recurringTransaction) {
    throw new AppError('Recurring transaction not found', 404);
  }
  return success(res, {
    message: 'Recurring transaction retrieved successfully',
    data: recurringTransaction
  });
});

/** Create a new recurring transaction. */
const createRecurringTransaction = asyncHandler(async (req, res) => {
  const recurringTransaction = await recurringTransactionService.create(req.user.id, req.body);
  return success(res, {
    statusCode: 201,
    message: 'Recurring transaction created successfully',
    data: recurringTransaction
  });
});

/** Update an existing recurring transaction. */
const updateRecurringTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const recurringTransaction = await recurringTransactionService.update(id, req.user.id, req.body);
  if (!recurringTransaction) {
    throw new AppError('Recurring transaction not found', 404);
  }
  return success(res, {
    message: 'Recurring transaction updated successfully',
    data: recurringTransaction
  });
});

/** Delete a recurring transaction. */
const deleteRecurringTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await recurringTransactionService.remove(id, req.user.id);
  if (!deleted) {
    throw new AppError('Recurring transaction not found', 404);
  }
  return success(res, {
    message: 'Recurring transaction deleted successfully',
    data: { id: Number(id) }
  });
});

/** Bulk insert recurring transactions from a parsed list. */
const createBulkRecurringTransactions = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('No items provided for bulk insert', 400);
  }
  const { created, errors } = await recurringTransactionService.bulkCreate(req.user.id, items);
  return success(res, {
    statusCode: 201,
    message: `Bulk insert finished: ${created.length} created, ${errors.length} failed`,
    data: { createdCount: created.length, failedCount: errors.length, created, errors }
  });
});

/** Bulk delete recurring transactions owned by the authenticated user. */
const bulkDeleteRecurringTransactions = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError('IDs array is required', 400);
  }
  const deletedCount = await recurringTransactionService.bulkDelete(ids, req.user.id);
  return success(res, {
    message: `${deletedCount} recurring transactions deleted`,
    data: { deletedCount }
  });
});

/** Generate transactions for every recurring rule that is due today. */
const generateDueTransactions = asyncHandler(async (req, res) => {
  const result = await recurringTransactionService.generateDue(req.user.id);
  return success(res, {
    message: `Generated ${result.createdCount} transaction(s) from recurring rules`,
    data: { createdCount: result.createdCount }
  });
});

module.exports = {
  getRecurringTransactions,
  getRecurringTransaction,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  createBulkRecurringTransactions,
  bulkDeleteRecurringTransactions,
  generateDueTransactions
};
