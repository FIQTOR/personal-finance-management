const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./user');

const UserPreference = sequelize.define('user_preference', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  theme: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'light'
  },
  language: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'en'
  }
}, {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
  // The unique constraint on user_id is created by
  // migrations/202400021-create-user-preferences.js — migrations are the single
  // source of truth (this project does not use sequelize.sync()).
});

UserPreference.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasOne(UserPreference, {
  as: 'preferences',
  foreignKey: 'user_id'
});

module.exports = UserPreference;
