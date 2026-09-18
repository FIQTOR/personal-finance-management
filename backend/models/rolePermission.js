// models/rolePermission.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RolePermission = sequelize.define('role_permission', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  role_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'roles',
      key: 'id'
    }
  },
  permission_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    references: {
      model: 'permissions',
      key: 'id'
    }
  }
}, {
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['role_id', 'permission_id']
    }
  ]
});

RolePermission.associate = (models) => {
  RolePermission.belongsTo(models.Role, {
    foreignKey: 'role_id',
    as: 'role'
  });
  RolePermission.belongsTo(models.Permission, {
    foreignKey: 'permission_id',
    as: 'permission'
  });
};

module.exports = RolePermission;
