const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');
const Category = require('./category');

const Budget = sequelize.define('budget', {
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
  limit_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'USD'
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Budget.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Budget.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category'
});

Category.hasMany(Budget, {
  foreignKey: 'category_id',
  as: 'budgets'
});

module.exports = Budget;
