const { Op } = require('sequelize');
const XLSX = require('xlsx');
const Transaction = require('../models/transaction');
const Category = require('../models/category');

class TransactionService {
  async getAllTransactions(userId, filters = {}) {
    const { category_id, currency, type, start_date, end_date } = filters;
    const where = { user_id: userId };

    if (category_id) where.category_id = category_id;
    if (currency) where.currency = currency;
    if (type) where.type = type;
    if (start_date || end_date) {
      where.date = {};
      if (start_date) where.date[Op.gte] = start_date;
      if (end_date) where.date[Op.lte] = end_date;
    }

    return await Transaction.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
      order: [['date', 'DESC'], ['id', 'DESC']]
    });
  }

  async getTransactionById(id, userId) {
    return await Transaction.findOne({
      where: { id, user_id: userId },
      include: [{ model: Category, as: 'category' }]
    });
  }

  async createTransaction(userId, data) {
    const { category_id, amount, currency, type, date, notes } = data;
    return await Transaction.create({
      user_id: userId,
      category_id,
      amount,
      currency: currency || 'USD',
      type,
      date,
      notes
    });
  }

  async updateTransaction(id, userId, data) {
    const transaction = await this.getTransactionById(id, userId);
    if (!transaction) return null;

    const { category_id, amount, currency, type, date, notes } = data;
    await transaction.update({
      category_id: category_id ?? transaction.category_id,
      amount: amount ?? transaction.amount,
      currency: currency ?? transaction.currency,
      type: type ?? transaction.type,
      date: date ?? transaction.date,
      notes: notes ?? transaction.notes
    });
    return await this.getTransactionById(id, userId);
  }

  async deleteTransaction(id, userId) {
    const transaction = await this.getTransactionById(id, userId);
    if (!transaction) return false;
    await transaction.destroy();
    return true;
  }

  async exportTransactionsToBuffer(userId, filters = {}) {
    const transactions = await this.getAllTransactions(userId, filters);
    
    const rows = transactions.map(t => ({
      ID: t.id,
      Date: t.date,
      Type: t.type.toUpperCase(),
      Category: t.category ? t.category.name : 'Uncategorized',
      Amount: parseFloat(t.amount),
      Currency: t.currency,
      Notes: t.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

module.exports = new TransactionService();
