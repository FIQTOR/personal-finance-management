// Transaction management controller.
const transactionService = require('../services/transactionService');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/response');

/** List the authenticated user's transactions with optional filters. */
const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await transactionService.getAllTransactions(req.user.id, req.query);
  return success(res, {
    message: 'Transactions retrieved successfully',
    data: transactions
  });
});

/** Get a single transaction owned by the authenticated user. */
const getTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transaction = await transactionService.getTransactionById(id, req.user.id);
  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }
  return success(res, {
    message: 'Transaction retrieved successfully',
    data: transaction
  });
});

/** Create a new transaction. */
const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createTransaction(req.user.id, req.body);
  return success(res, {
    statusCode: 201,
    message: 'Transaction created successfully',
    data: transaction
  });
});

/** Update an existing transaction. */
const updateTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const transaction = await transactionService.updateTransaction(id, req.user.id, req.body);
  if (!transaction) {
    throw new AppError('Transaction not found', 404);
  }
  return success(res, {
    message: 'Transaction updated successfully',
    data: transaction
  });
});

/** Delete a transaction. */
const deleteTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await transactionService.deleteTransaction(id, req.user.id);
  if (!deleted) {
    throw new AppError('Transaction not found', 404);
  }
  return success(res, {
    message: 'Transaction deleted successfully',
    data: { id: Number(id) }
  });
});

/** Bulk insert transactions from a parsed list. */
const createBulkTransactions = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('No items provided for bulk insert', 400);
  }
  const created = [];
  const errors = [];
  for (let i = 0; i < items.length; i++) {
    const row = items[i] || {};
    try {
      const item = await transactionService.createTransaction(req.user.id, row);
      created.push(item);
    } catch (err) {
      errors.push({ row: i + 1, name: row.notes || row.type || '-', message: err.message || 'Failed to create transaction' });
    }
  }
  return success(res, {
    statusCode: 201,
    message: `Bulk insert finished: ${created.length} created, ${errors.length} failed`,
    data: { createdCount: created.length, failedCount: errors.length, created, errors }
  });
});

/** Bulk delete transactions owned by the authenticated user. */
const bulkDeleteTransactions = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError('IDs array is required', 400);
  }
  const deletedCount = await transactionService.bulkDeleteTransactions(ids, req.user.id);
  return success(res, {
    message: `${deletedCount} transactions deleted`,
    data: { deletedCount }
  });
});

/** Stream the authenticated user's filtered transactions as an .xlsx file. */
const exportTransactions = asyncHandler(async (req, res) => {
  const buffer = await transactionService.exportTransactionsToBuffer(req.user.id, req.query);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions.xlsx"');
  return res.send(buffer);
});

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  createBulkTransactions,
  updateTransaction,
  deleteTransaction,
  bulkDeleteTransactions,
  exportTransactions
};
