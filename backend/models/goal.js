const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const Goal = sequelize.define('goal', {
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
    type: DataTypes.STRING(150),
    allowNull: false
  },
  target_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  current_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  currency: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'USD'
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

Goal.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

module.exports = Goal;
