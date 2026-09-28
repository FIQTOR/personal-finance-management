const { Op } = require('sequelize');
const sequelize = require('../config/database');
const RecurringTransaction = require('../models/recurringTransaction');
const Transaction = require('../models/transaction');
const Category = require('../models/category');

/** Today's date as an ISO `YYYY-MM-DD` string. */
const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Advance an ISO date string by `count` periods of the given frequency.
 * Pure date arithmetic on the date part only (no timezone drift).
 */
const advanceDate = (isoDate, frequency, count = 1) => {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const n = Math.max(1, Number(count) || 1);
  switch (frequency) {
    case 'daily':
      date.setUTCDate(date.getUTCDate() + n);
      break;
    case 'weekly':
      date.setUTCDate(date.getUTCDate() + 7 * n);
      break;
    case 'yearly':
      date.setUTCFullYear(date.getUTCFullYear() + n);
      break;
    case 'monthly':
    default:
      date.setUTCMonth(date.getUTCMonth() + n);
      break;
  }
  return date.toISOString().slice(0, 10);
};

class RecurringTransactionService {
  async getAll(userId, filters = {}) {
    const { category_id, currency, type, frequency, is_active } = filters;
    const where = { user_id: userId };

    if (category_id) where.category_id = category_id;
    if (currency) where.currency = currency;
    if (type) where.type = type;
    if (frequency) where.frequency = frequency;
    if (is_active !== undefined && is_active !== '') {
      where.is_active = is_active === true || is_active === 'true';
    }

    return await RecurringTransaction.findAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'color', 'icon'] }],
      order: [['next_run_date', 'ASC'], ['id', 'DESC']]
    });
  }

  async getById(id, userId) {
    return await RecurringTransaction.findOne({
      where: { id, user_id: userId },
      include: [{ model: Category, as: 'category' }]
    });
  }

  async create(userId, data) {
    const {
      category_id, amount, currency, type, frequency, interval_count,
      start_date, end_date, next_run_date, notes, is_active
    } = data;
    return await RecurringTransaction.create({
      user_id: userId,
      category_id: category_id ?? null,
      amount,
      currency: currency || 'USD',
      type,
      frequency: frequency || 'monthly',
      interval_count: interval_count ?? 1,
      start_date,
      end_date: end_date ?? null,
      // Default the first run to the start date unless explicitly provided.
      next_run_date: next_run_date || start_date,
      notes: notes ?? null,
      is_active: is_active ?? true
    });
  }

  async update(id, userId, data) {
    const recurring = await this.getById(id, userId);
    if (!recurring) return null;

    const {
      category_id, amount, currency, type, frequency, interval_count,
      start_date, end_date, next_run_date, notes, is_active
    } = data;
    await recurring.update({
      category_id: category_id !== undefined ? (category_id ?? null) : recurring.category_id,
      amount: amount ?? recurring.amount,
      currency: currency ?? recurring.currency,
      type: type ?? recurring.type,
      frequency: frequency ?? recurring.frequency,
      interval_count: interval_count ?? recurring.interval_count,
      start_date: start_date ?? recurring.start_date,
      end_date: end_date !== undefined ? (end_date ?? null) : recurring.end_date,
      next_run_date: next_run_date ?? recurring.next_run_date,
      notes: notes !== undefined ? (notes ?? null) : recurring.notes,
      is_active: is_active ?? recurring.is_active
    });
    return await this.getById(id, userId);
  }

  async remove(id, userId) {
    const recurring = await this.getById(id, userId);
    if (!recurring) return false;
    await recurring.destroy();
    return true;
  }

  async bulkCreate(userId, items = []) {
    const created = [];
    const errors = [];
    for (let i = 0; i < items.length; i++) {
      const row = items[i] || {};
      try {
        const item = await this.create(userId, row);
        created.push(item);
      } catch (err) {
        errors.push({
          row: i + 1,
          name: row.notes || row.type || '-',
          message: err.message || 'Failed to create recurring transaction'
        });
      }
    }
    return { created, errors };
  }

  async bulkDelete(ids, userId) {
    return await RecurringTransaction.destroy({ where: { id: ids, user_id: userId } });
  }

  /**
   * Generate Transactions for every active recurring rule of the user whose
   * `next_run_date` has arrived (<= today). Advances `next_run_date` by
   * `frequency * interval_count` until it is in the future, marks
   * `last_run_date`, and deactivates rules whose `end_date` has passed.
   *
   * Runs inside a single DB transaction and is idempotent per day: a rule can
   * never generate twice for the same date because `next_run_date` is advanced
   * past `today` before the transaction commits.
   */
  async generateDue(userId) {
    const today = todayISO();
    return await sequelize.transaction(async (t) => {
      const due = await RecurringTransaction.findAll({
        where: {
          user_id: userId,
          is_active: true,
          next_run_date: { [Op.lte]: today }
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      let createdCount = 0;
      const createdTransactions = [];

      for (const rule of due) {
        let cursor = rule.next_run_date;
        let lastRun = rule.last_run_date;
        const interval = Math.max(1, Number(rule.interval_count) || 1);

        // Loop until the next run lands in the future (or the rule ends).
        // Guard against runaway loops with a hard cap.
        let guard = 0;
        while (cursor <= today && guard < 1000) {
          guard += 1;

          // Past the end date → stop generating and deactivate.
          if (rule.end_date && cursor > rule.end_date) break;

          const transaction = await Transaction.create({
            user_id: userId,
            category_id: rule.category_id,
            amount: rule.amount,
            currency: rule.currency,
            type: rule.type,
            date: cursor,
            notes: rule.notes
          }, { transaction: t });

          createdTransactions.push(transaction);
          createdCount += 1;
          lastRun = cursor;
          cursor = advanceDate(cursor, rule.frequency, interval);
        }

        const pastEnd = !!(rule.end_date && cursor > rule.end_date);
        await rule.update({
          next_run_date: cursor,
          last_run_date: lastRun,
          is_active: pastEnd ? false : rule.is_active
        }, { transaction: t });
      }

      return { createdCount, transactions: createdTransactions };
    });
  }
}

module.exports = new RecurringTransactionService();
