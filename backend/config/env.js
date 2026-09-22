/**
 * Environment loader & validator (fail-fast).
 *
 * Loads the correct .env file based on NODE_ENV and validates that all required
 * variables are present before the application starts. If anything is missing
 * the process exits with a clear message instead of failing later at runtime.
 *
 * Usage:
 *   const env = require('./config/env');
 */
const path = require('path');
const dotenv = require('dotenv');

const NODE_ENV = process.env.NODE_ENV || 'development';

// production -> .env, everything else -> .env.{env}
const envFile = NODE_ENV === 'production' ? '.env' : `.env.${NODE_ENV}`;

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

const isProduction = NODE_ENV === 'production';

/**
 * Variables that must always be defined.
 * PORT, DB_PORT and COOKIE_DOMAIN are optional / have sane defaults.
 */
const requiredVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
];

const missing = requiredVars.filter((key) => !process.env[key] || String(process.env[key]).trim() === '');

if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
        `\n❌ Missing required environment variables: ${missing.join(', ')}\n` +
        `   File checked: ${envFile}\n` +
        `   Copy .env.example to ${envFile} and fill in the values.\n`
    );
    process.exit(1);
}

const env = {
    NODE_ENV,
    isProduction,
    isDevelopment: !isProduction,
    PORT: Number(process.env.PORT) || 4000,

    // Frontend / CORS
    FRONTEND_HOST: process.env.FRONTEND_HOST || 'http://localhost:5173',
    // Comma separated list of allowed origins. Falls back to FRONTEND_HOST.
    CORS_ORIGINS: (process.env.CORS_ORIGINS || process.env.FRONTEND_HOST || 'http://localhost:5173')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),

    // Database
    DB_HOST: process.env.DB_HOST,
    DB_PORT: Number(process.env.DB_PORT) || 3306,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_DIALECT: process.env.DB_DIALECT || 'mysql',

    // Tokens
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET || null,
    ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || '15m',
    REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL || '1d',
    REFRESH_TOKEN_TTL_REMEMBER: process.env.REFRESH_TOKEN_TTL_REMEMBER || '30d',

    // Cookies
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
    COOKIE_SECURE: process.env.COOKIE_SECURE
        ? process.env.COOKIE_SECURE === 'true'
        : isProduction,

    // Google OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CLIENT_REFRESH_TOKEN: process.env.GOOGLE_CLIENT_REFRESH_TOKEN,
    GOOGLE_DRIVE_ID_USER: process.env.GOOGLE_DRIVE_ID_USER,

    // Email
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: Number(process.env.EMAIL_PORT) || 587,
    EMAIL_USERNAME: process.env.EMAIL_USERNAME,
    EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
    EMAIL_FROM: process.env.EMAIL_FROM || '"App" <no-reply@example.com>',

    // Branding
    APP_NAME: process.env.APP_NAME || 'App',
};

module.exports = env;
