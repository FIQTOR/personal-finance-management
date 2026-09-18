'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = await queryInterface.sequelize.query(`SELECT id FROM users LIMIT 1;`);
    const userId = users[0][0] ? users[0][0].id : 1;

    const categoriesData = [
      { id: 1, user_id: userId, name: 'Salary', type: 'income', icon: 'wallet', color: '#10B981', created_at: new Date(), updated_at: new Date() },
      { id: 2, user_id: userId, name: 'Freelance', type: 'income', icon: 'briefcase', color: '#3B82F6', created_at: new Date(), updated_at: new Date() },
      { id: 3, user_id: userId, name: 'Food & Dining', type: 'expense', icon: 'utensils', color: '#EF4444', created_at: new Date(), updated_at: new Date() },
      { id: 4, user_id: userId, name: 'Utilities & Bills', type: 'expense', icon: 'zap', color: '#F59E0B', created_at: new Date(), updated_at: new Date() },
      { id: 5, user_id: userId, name: 'Entertainment', type: 'expense', icon: 'film', color: '#8B5CF6', created_at: new Date(), updated_at: new Date() },
      { id: 6, user_id: userId, name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#EC4899', created_at: new Date(), updated_at: new Date() }
    ];

    await queryInterface.bulkInsert('categories', categoriesData, {});

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    const transactionsData = [
      { user_id: userId, category_id: 1, amount: 5000.00, currency: 'USD', type: 'income', date: `${currentYear}-${currentMonth}-01`, notes: 'Monthly Salary Payment', created_at: new Date(), updated_at: new Date() },
      { user_id: userId, category_id: 2, amount: 1200.00, currency: 'USD', type: 'income', date: `${currentYear}-${currentMonth}-05`, notes: 'Web Design Project', created_at: new Date(), updated_at: new Date() },
      { user_id: userId, category_id: 3, amount: 150.50, currency: 'USD', type: 'expense', date: `${currentYear}-${currentMonth}-07`, notes: 'Grocery Shopping', created_at: new Date(), updated_at: new Date() },
      { user_id: userId, category_id: 4, amount: 210.00, currency: 'USD', type: 'expense', date: `${currentYear}-${currentMonth}-10`, notes: 'Electricity & Internet', created_at: new Date(), updated_at: new Date() },
      { user_id: userId, category_id: 5, amount: 45.00, currency: 'USD', type: 'expense', date: `${currentYear}-${currentMonth}-12`, notes: 'Movie tickets', created_at: new Date(), updated_at: new Date() },
      { user_id: userId, category_id: 6, amount: 320.00, currency: 'USD', type: 'expense', date: `${currentYear}-${currentMonth}-14`, notes: 'New Clothes & Shoes', created_at: new Date(), updated_at: new Date() },
      { user_id: userId, category_id: 3, amount: 85.00, currency: 'USD', type: 'expense', date: `${currentYear}-${currentMonth}-15`, notes: 'Dinner with family', created_at: new Date(), updated_at: new Date() }
    ];

    await queryInterface.bulkInsert('transactions', transactionsData, {});

    const budgetsData = [
      { user_id: userId, category_id: 3, limit_amount: 600.00, currency: 'USD', start_date: `${currentYear}-${currentMonth}-01`, end_date: `${currentYear}-${currentMonth}-28`, created_at: new Date(), updated_at: new Date() },
      { user_id: userId, category_id: 4, limit_amount: 300.00, currency: 'USD', start_date: `${currentYear}-${currentMonth}-01`, end_date: `${currentYear}-${currentMonth}-28`, created_at: new Date(), updated_at: new Date() },
      { user_id: userId, category_id: 5, limit_amount: 150.00, currency: 'USD', start_date: `${currentYear}-${currentMonth}-01`, end_date: `${currentYear}-${currentMonth}-28`, created_at: new Date(), updated_at: new Date() },
      { user_id: userId, category_id: 6, limit_amount: 500.00, currency: 'USD', start_date: `${currentYear}-${currentMonth}-01`, end_date: `${currentYear}-${currentMonth}-28`, created_at: new Date(), updated_at: new Date() }
    ];

    await queryInterface.bulkInsert('budgets', budgetsData, {});

    const goalsData = [
      { user_id: userId, name: 'Emergency Savings Fund', target_amount: 10000.00, current_amount: 4500.00, currency: 'USD', deadline: `${currentYear}-12-31`, created_at: new Date(), updated_at: new Date() },
      { user_id: userId, name: 'Vacation to Japan', target_amount: 3500.00, current_amount: 1800.00, currency: 'USD', deadline: `${currentYear}-11-30`, created_at: new Date(), updated_at: new Date() },
      { user_id: userId, name: 'New Laptop', target_amount: 2000.00, current_amount: 1200.00, currency: 'USD', deadline: `${currentYear}-09-30`, created_at: new Date(), updated_at: new Date() }
    ];

    await queryInterface.bulkInsert('goals', goalsData, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('goals', null, {});
    await queryInterface.bulkDelete('budgets', null, {});
    await queryInterface.bulkDelete('transactions', null, {});
    await queryInterface.bulkDelete('categories', null, {});
  }
};
