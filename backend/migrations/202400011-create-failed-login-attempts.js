'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('failed_login_attempts', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT.UNSIGNED
            },
            ip_address: {
                type: Sequelize.STRING,
                allowNull: false
            },
            attempts: {
                type: Sequelize.INTEGER,
                defaultValue: 1
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Add index for faster lookups
        await queryInterface.addIndex('failed_login_attempts', ['ip_address', 'created_at']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('failed_login_attempts');
    }
};