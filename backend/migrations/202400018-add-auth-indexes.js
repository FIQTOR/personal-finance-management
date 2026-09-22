'use strict';

/**
 * Auth hardening migration.
 *
 * 1. Renames the plaintext token columns on auth tables to `token_hash` so only
 *    SHA-256 hashes are stored (refresh / reset / verification tokens).
 * 2. Adds lookup indexes for auth queries and a DB-level unique email.
 *
 * Uses `showIndex` guards so it is safe to run on databases that already have
 * some of these indexes (e.g. created by model sync).
 */

async function addIndexIfMissing(queryInterface, table, fields, options = {}) {
    const existing = await queryInterface.showIndex(table);
    const target = Array.isArray(fields) ? fields : [fields];
    const already = existing.some((idx) => {
        const cols = idx.fields.map((f) => f.attribute || f.name);
        return target.every((c) => cols.includes(c)) && cols.length === target.length;
    });
    if (already) return;
    await queryInterface.addIndex(table, fields, options);
}

/** Rename a column only if the old name exists (idempotent). */
async function renameColumnIfExists(queryInterface, table, from, to, type) {
    const description = await queryInterface.describeTable(table);
    if (description[from] && !description[to]) {
        await queryInterface.renameColumn(table, from, to);
        // Ensure a consistent, indexable width for hashes.
        await queryInterface.changeColumn(table, to, type);
    }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // --- Rename plaintext token columns to token_hash --------------------
        await renameColumnIfExists(queryInterface, 'user_sessions', 'token', 'token_hash', {
            type: Sequelize.STRING(255),
            allowNull: false,
        });
        await renameColumnIfExists(queryInterface, 'verification_tokens', 'token', 'token_hash', {
            type: Sequelize.STRING(64),
            allowNull: false,
        });
        await renameColumnIfExists(queryInterface, 'reset_password_tokens', 'token', 'token_hash', {
            type: Sequelize.STRING(64),
            allowNull: false,
        });

        // Session device metadata is optional (may be null for API/service logins).
        const sessionCols = await queryInterface.describeTable('user_sessions');
        if (sessionCols.device_info && !sessionCols.device_info.allowNull) {
            await queryInterface.changeColumn('user_sessions', 'device_info', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
        if (sessionCols.ip_address && !sessionCols.ip_address.allowNull) {
            await queryInterface.changeColumn('user_sessions', 'ip_address', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }

        // --- Unique email ----------------------------------------------------
        const userIndexes = await queryInterface.showIndex('users');
        const emailUnique = userIndexes.some(
            (idx) => idx.unique && idx.fields.some((f) => (f.attribute || f.name) === 'email')
        );
        if (!emailUnique) {
            await queryInterface.addIndex('users', ['email'], {
                unique: true,
                name: 'users_email_unique',
            });
        }

        // --- Lookup indexes --------------------------------------------------
        await addIndexIfMissing(queryInterface, 'users', ['role_id'], { name: 'users_role_id_idx' });
        await addIndexIfMissing(queryInterface, 'user_sessions', ['token_hash'], { name: 'user_sessions_token_hash_idx' });
        await addIndexIfMissing(queryInterface, 'user_sessions', ['user_id'], { name: 'user_sessions_user_id_idx' });
        await addIndexIfMissing(queryInterface, 'verification_tokens', ['token_hash'], { name: 'verification_tokens_token_hash_idx' });
        await addIndexIfMissing(queryInterface, 'verification_tokens', ['user_id'], { name: 'verification_tokens_user_id_idx' });
        await addIndexIfMissing(queryInterface, 'reset_password_tokens', ['token_hash'], { name: 'reset_password_tokens_token_hash_idx' });
        await addIndexIfMissing(queryInterface, 'reset_password_tokens', ['user_id'], { name: 'reset_password_tokens_user_id_idx' });
        await addIndexIfMissing(queryInterface, 'user_activities', ['user_id'], { name: 'user_activities_user_id_idx' });
        await addIndexIfMissing(queryInterface, 'user_activities', ['activity_type'], { name: 'user_activities_activity_type_idx' });
        await addIndexIfMissing(queryInterface, 'user_activities', ['created_at'], { name: 'user_activities_created_at_idx' });
    },

    async down(queryInterface, Sequelize) {
        const drop = async (table, name) => {
            try {
                await queryInterface.removeIndex(table, name);
            } catch (e) {
                // index may not exist
            }
        };
        await drop('users', 'users_email_unique');
        await drop('users', 'users_role_id_idx');
        await drop('user_sessions', 'user_sessions_token_hash_idx');
        await drop('user_sessions', 'user_sessions_user_id_idx');
        await drop('verification_tokens', 'verification_tokens_token_hash_idx');
        await drop('verification_tokens', 'verification_tokens_user_id_idx');
        await drop('reset_password_tokens', 'reset_password_tokens_token_hash_idx');
        await drop('reset_password_tokens', 'reset_password_tokens_user_id_idx');
        await drop('user_activities', 'user_activities_user_id_idx');
        await drop('user_activities', 'user_activities_activity_type_idx');
        await drop('user_activities', 'user_activities_created_at_idx');

        // Revert column names (best-effort).
        const revert = async (table, from, to, type) => {
            const description = await queryInterface.describeTable(table);
            if (description[from] && !description[to]) {
                await queryInterface.renameColumn(table, from, to);
                await queryInterface.changeColumn(table, to, type);
            }
        };
        await revert(queryInterface, 'user_sessions', 'token_hash', 'token', { type: Sequelize.TEXT, allowNull: false });
        await revert(queryInterface, 'verification_tokens', 'token_hash', 'token', { type: Sequelize.STRING, allowNull: false });
        await revert(queryInterface, 'reset_password_tokens', 'token_hash', 'token', { type: Sequelize.STRING, allowNull: false });
    },
};
