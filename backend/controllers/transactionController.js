const transactionService = require('../services/transactionService');

class TransactionController {
  async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const transactions = await transactionService.getAllTransactions(userId, req.query);
      return res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve transactions',
        errors: [error.message]
      });
    }
  }

  async getTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const transaction = await transactionService.getTransactionById(id, userId);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          errors: ['Transaction with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Transaction retrieved successfully',
        data: transaction
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction',
        errors: [error.message]
      });
    }
  }

  async createTransaction(req, res) {
    try {
      const userId = req.user.id;
      const transaction = await transactionService.createTransaction(userId, req.body);
      return res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create transaction',
        errors: [error.message]
      });
    }
  }

  async updateTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const transaction = await transactionService.updateTransaction(id, userId, req.body);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          errors: ['Transaction with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update transaction',
        errors: [error.message]
      });
    }
  }

  async deleteTransaction(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const deleted = await transactionService.deleteTransaction(id, userId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
          errors: ['Transaction with specified ID does not exist']
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully',
        data: { id: Number(id) }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete transaction',
        errors: [error.message]
      });
    }
  }

  async exportTransactions(req, res) {
    try {
      const userId = req.user.id;
      const buffer = await transactionService.exportTransactionsToBuffer(userId, req.query);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.xlsx"');
      return res.send(buffer);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to export transactions',
        errors: [error.message]
      });
    }
  }
}

module.exports = new TransactionController();
