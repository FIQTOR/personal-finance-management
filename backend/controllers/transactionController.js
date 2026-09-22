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
  updateTransaction,
  deleteTransaction,
  exportTransactions
};
