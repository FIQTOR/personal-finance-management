const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const Category = sequelize.define('category', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('income', 'expense'),
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Category.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

module.exports = Category;
