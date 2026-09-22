/**
 * Model barrel.
 *
 * Each model in this folder is defined independently using the shared
 * `config/database.js` Sequelize instance, so this file simply re-exports them.
 *
 * NOTE: Do NOT re-initialise Sequelize here (the previous version tried to read
 * a non-existent `config/config.json` and would crash if ever required). Use
 * `config/database.js` as the single Sequelize instance.
 */

const sequelize = require('../config/database');

const User = require('./user');
const Role = require('./role');
const Permission = require('./permission');
const RolePermission = require('./rolePermission');
const UserSession = require('./userSession');
const UserActivity = require('./userActivity');
const FailedLoginAttempt = require('./failedLoginAttempt');
const ResetPasswordToken = require('./resetPasswordToken');
const VerificationToken = require('./verificationToken');

// Finance domain models
const Category = require('./category');
const Transaction = require('./transaction');
const Budget = require('./budget');
const Goal = require('./goal');
const AppSetting = require('./appSetting');

module.exports = {
    sequelize,
    User,
    Role,
    Permission,
    RolePermission,
    UserSession,
    UserActivity,
    FailedLoginAttempt,
    ResetPasswordToken,
    VerificationToken,
    Category,
    Transaction,
    Budget,
    Goal,
    AppSetting,
};
