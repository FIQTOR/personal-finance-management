require("dotenv").config();
const env = process.env.NODE_ENV || "development";

// kalau production → .env, kalau selain itu → .env.{env}
const envFile = env === "production" ? ".env" : `.env.${env}`;

require("dotenv").config({ path: envFile, override: true });

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,

    dialect: process.env.DB_DIALECT === 'pg' ? require('pg') : process.env.DB_DIALECT || "mysql",
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,

    dialect: process.env.DB_DIALECT === 'pg' ? require('pg') : process.env.DB_DIALECT || "mysql",
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,

    dialect: process.env.DB_DIALECT === 'pg' ? require('pg') : process.env.DB_DIALECT || "mysql",
  },
};
