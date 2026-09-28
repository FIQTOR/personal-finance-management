'use strict';

/**
 * Finance lookup indexes.
 *
 * Adds covering indexes for the most common finance queries (ownership +
 * date-range scans). Uses `showIndex` guards so it is safe to run on databases
 * that already have some of these indexes (e.g. created by model sync).
 */

async function addIndexIfMissing(queryInterface, table, fields, options = {}) {
  const existing = await queryInterface.showIndex(table);
  const target = Array.isArray(fields) ? fields : [fields];
  const already = existing.some((idx) => {
    const cols = idx.fields.map((f) => f.attribute || f.name);
    return target.every((c) => cols.includes(c)) && cols.length === target.length;
  });
  if (already) return;
  await queryInterface.addIndex(table, fields, options);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await addIndexIfMissing(queryInterface, 'transactions', ['user_id'], { name: 'transactions_user_id_idx' });
    await addIndexIfMissing(queryInterface, 'transactions', ['date'], { name: 'transactions_date_idx' });
    await addIndexIfMissing(queryInterface, 'budgets', ['user_id'], { name: 'budgets_user_id_idx' });
    await addIndexIfMissing(queryInterface, 'goals', ['user_id'], { name: 'goals_user_id_idx' });
    await addIndexIfMissing(queryInterface, 'categories', ['user_id'], { name: 'categories_user_id_idx' });
  },

  async down(queryInterface) {
    const drop = async (table, name) => {
      try {
        await queryInterface.removeIndex(table, name);
      } catch (e) {
        // index may not exist
      }
    };
    await drop('transactions', 'transactions_user_id_idx');
    await drop('transactions', 'transactions_date_idx');
    await drop('budgets', 'budgets_user_id_idx');
    await drop('goals', 'goals_user_id_idx');
    await drop('categories', 'categories_user_id_idx');
  }
};
