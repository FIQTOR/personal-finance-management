const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FailedLoginAttempt = sequelize.define('failed_login_attempts', {
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    ip_address: {
        type: DataTypes.STRING,
        allowNull: false
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'failed_login_attempts',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        { fields: ['ip_address'] }
    ]
});

module.exports = FailedLoginAttempt;
