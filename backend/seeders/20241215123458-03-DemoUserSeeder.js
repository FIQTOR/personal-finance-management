'use strict';

const bcrypt = require('bcryptjs');

/**
 * Demo user seeder.
 *
 * The application intentionally ships without a user seeder so that the first
 * run uses the "setup" flow. For local demo purposes we create a single
 * verified owner user so the finance demo seeder (05-FinanceSeeder) has an
 * owner to attach its categories/transactions/budgets/goals to.
 *
 * Credentials: admin@gmail.com / 123456789
 */
const BCRYPT_COST = 12;
const DEMO_EMAIL = 'admin@gmail.com';
const DEMO_PASSWORD = '123456789';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Ensure the "user" role exists (created by 01-RolePermissionSeeder).
        let roleId = 1;
        const roles = await queryInterface.sequelize.query(
            `SELECT id FROM roles WHERE name = 'user' LIMIT 1;`
        );
        if (roles[0] && roles[0][0]) {
            roleId = roles[0][0].id;
        }

        // Idempotent: skip if the demo user already exists.
        const existing = await queryInterface.sequelize.query(
            `SELECT id FROM users WHERE email = :email LIMIT 1;`,
            { replacements: { email: DEMO_EMAIL } }
        );
        if (existing[0] && existing[0][0]) {
            return;
        }

        const now = new Date();
        const hashed = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_COST);

        await queryInterface.bulkInsert('users', [
            {
                name: 'Administrator',
                email: DEMO_EMAIL,
                password: hashed,
                role_id: roleId,
                is_verified: true,
                is_blocked: false,
                last_password_change: now,
                created_at: now,
                updated_at: now,
            },
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.bulkDelete('users', { email: DEMO_EMAIL }, {});
    },
};
