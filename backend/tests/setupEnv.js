/**
 * Jest environment bootstrap.
 *
 * Runs before any module is loaded (via `setupFiles`) so that the fail-fast
 * `config/env.js` loader always has the required variables available — the
 * test suite must not depend on a committed `.env.test`.
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const defaults = {
    DB_HOST: 'localhost',
    DB_NAME: 'finance_test',
    DB_USER: 'test',
    DB_PASSWORD: '',
    DB_DIALECT: 'mysql',
    ACCESS_TOKEN_SECRET: 'test-access-secret',
    REFRESH_TOKEN_SECRET: 'test-refresh-secret',
    // Required at boot by the Passport Google OAuth strategy.
    GOOGLE_CLIENT_ID: 'test-google-client-id',
};

for (const [key, value] of Object.entries(defaults)) {
    if (!process.env[key] || String(process.env[key]).trim() === '') {
        process.env[key] = value;
    }
}
