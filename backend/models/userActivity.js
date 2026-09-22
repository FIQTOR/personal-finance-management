const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const UserActivity = sequelize.define('user_activity', {
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
  activity_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('warning', 'info', 'danger'),
    allowNull: false,
    defaultValue: 'info'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_general: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true
  }
}, {
  tableName: 'user_activities',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['activity_type'] },
    { fields: ['created_at'] }
  ]
});

UserActivity.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

module.exports = UserActivity;