const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const UserSession = sequelize.define('user_sessions', {
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
  token_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  device_info: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  // Timestamps and Audit Fields
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
}, {
  tableName: 'user_sessions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

UserSession.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

module.exports = UserSession;
