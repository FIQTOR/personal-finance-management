const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FailedLoginAttempt = sequelize.define('failed_login_attempts', {
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
    }
}, {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at'
});

module.exports = FailedLoginAttempt;