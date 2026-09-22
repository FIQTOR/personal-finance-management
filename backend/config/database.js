const { Sequelize } = require('sequelize');
const env = require('./env');

/**
 * Shared Sequelize instance.
 *
 * Dialect is selected from DB_DIALECT. For postgres, the `pg` package is used.
 */
const dialect = env.DB_DIALECT === 'pg' ? 'postgres' : env.DB_DIALECT;

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
    host: env.DB_HOST || 'localhost',
    port: env.DB_PORT || 3306,
    dialect,
    logging: false,
});

module.exports = sequelize;
