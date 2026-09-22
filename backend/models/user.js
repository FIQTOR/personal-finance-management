const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Role = require('./role');

const User = sequelize.define('user', {
    // Primary Key
    id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    // Basic Information
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    avatar_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Authentication
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    last_password_change: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    google_id: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // User Status
    is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
    },
    is_blocked: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    blocked_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Role Reference
    role_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        references: {
            model: 'roles',
            key: 'id',
        }
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
    created_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        }
    },
    updated_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        }
    },
    deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    deleted_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id',
        }
    },
}, {
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    // Never expose the password hash / OAuth id / password-change time by default.
    // Auth flows that need the password must use the `withSecrets` scope.
    defaultScope: {
        attributes: { exclude: ['password', 'google_id', 'last_password_change'] }
    },
    scopes: {
        withSecrets: { attributes: { include: ['password'] } },
    },
    indexes: [
        { unique: true, fields: ['email'] },
        { fields: ['role_id'] }
    ]
});

User.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'role'
});

// Add associations for created_by and updated_by
User.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator'
});

User.belongsTo(User, {
    foreignKey: 'updated_by',
    as: 'updater'
});

User.belongsTo(User, {
    foreignKey: 'deleted_by',
    as: 'deletor'
});

module.exports = User;
