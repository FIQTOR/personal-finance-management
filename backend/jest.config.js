/** Jest configuration for the backend test suite. */
module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    // Seed required env vars before the fail-fast config/env.js loader runs.
    setupFiles: ['<rootDir>/tests/setupEnv.js'],
};
