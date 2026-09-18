const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Category = require('./category');

const Transaction = sequelize.define('transaction', {
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
    }
  },
  category_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id'
    }
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Transaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Transaction.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

Category.hasMany(Transaction, {
  foreignKey: 'category_id',
  as: 'transactions'
});

module.exports = Transaction;
