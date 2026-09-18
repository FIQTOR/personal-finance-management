'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const roles = [
      { id: 1, name: 'user', description: 'Personal Finance System Owner', created_at: new Date(), updated_at: new Date() }
    ];
    await queryInterface.bulkInsert('roles', roles, {});

    const permissions = [
      { name: 'view_dashboard', description: 'Can view dashboard', created_at: new Date(), updated_at: new Date() },
      { name: 'manage_users', description: 'Can manage users', created_at: new Date(), updated_at: new Date() },
      { name: 'manage_roles', description: 'Can manage roles and permissions', created_at: new Date(), updated_at: new Date() },
      { name: 'all_access', description: 'Has all access permissions', created_at: new Date(), updated_at: new Date() }
    ];
    await queryInterface.bulkInsert('permissions', permissions, {});

    const allPermissions = await queryInterface.sequelize.query(`SELECT id FROM permissions;`);

    const rolePermissions = allPermissions[0].map(permission => ({
      role_id: 1,
      permission_id: permission.id,
      created_at: new Date(),
      updated_at: new Date()
    }));

    await queryInterface.bulkInsert('role_permissions', rolePermissions, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
