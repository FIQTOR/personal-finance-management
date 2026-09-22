const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VerificationToken = sequelize.define('verification_token', {
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
  // SHA-256 hash of the token that is emailed to the user.
  token_hash: {
    type: DataTypes.STRING(64),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'verification_tokens',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { unique: true, fields: ['token_hash'] },
    { fields: ['user_id'] }
  ]
});

VerificationToken.belongsTo(require('./user'), {
  foreignKey: 'user_id',
  as: 'user'
});

module.exports = VerificationToken;
