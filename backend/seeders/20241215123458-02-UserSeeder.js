'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // User seeder removed to allow setup flow on empty database
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};
