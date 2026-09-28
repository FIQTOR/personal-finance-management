const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Category = require('./category');

const RecurringTransaction = sequelize.define('recurring_transaction', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  category_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'USD'
  },
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false
  },
  frequency: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'yearly'),
    allowNull: false,
    defaultValue: 'monthly'
  },
  interval_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  next_run_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  last_run_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
  // Indexes (user_id, next_run_date) are created by
  // migrations/202400019-create-recurring-transactions.js — migrations are the
  // single source of truth (this project does not use sequelize.sync()).
});

RecurringTransaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

RecurringTransaction.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

Category.hasMany(RecurringTransaction, {
  foreignKey: 'category_id',
  as: 'recurring_transactions'
});

module.exports = RecurringTransaction;
