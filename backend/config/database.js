const { Sequelize } = require("sequelize");
require("dotenv").config();
const env = process.env.NODE_ENV || "development";

// kalau production → .env, kalau selain itu → .env.{env}
const envFile = env === "production" ? ".env" : `.env.${env}`;

require("dotenv").config({ path: envFile, override: true });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT || 3306,
        dialect: process.env.DB_DIALECT === 'pg' ? require('pg') : process.env.DB_DIALECT || "mysql",
        logging: false,
    }
);

module.exports = sequelize;
