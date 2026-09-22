const env = require('./env');

/**
 * Sequelize CLI configuration.
 * Reads connection settings from the centralised env loader so there is a
 * single place that knows how to build a DB config.
 */
const base = {
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: env.DB_DIALECT === 'pg' ? 'postgres' : env.DB_DIALECT,
  logging: false,
};

module.exports = {
  development: base,
  test: base,
  production: base,
};
