'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('recurring_transactions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'USD'
      },
      type: {
        type: Sequelize.ENUM('income', 'expense'),
        allowNull: false
      },
      frequency: {
        type: Sequelize.ENUM('daily', 'weekly', 'monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'monthly'
      },
      interval_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      next_run_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      last_run_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('recurring_transactions', ['user_id'], {
      name: 'recurring_transactions_user_id_idx'
    });
    await queryInterface.addIndex('recurring_transactions', ['next_run_date'], {
      name: 'recurring_transactions_next_run_date_idx'
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('recurring_transactions');
  }
};
