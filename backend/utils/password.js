/**
 * Password hashing & policy utilities.
 * Centralises bcrypt cost so every code path uses the same strength.
 */
const bcrypt = require('bcryptjs');
const AppError = require('./AppError');

const BCRYPT_COST = 12;

const PASSWORD_MIN_LENGTH = 8;

/**
 * Hash a plaintext password using a single global cost factor.
 * @param {string} password
 * @returns {Promise<string>}
 */
const hashPassword = (password) => bcrypt.hash(password, BCRYPT_COST);

/**
 * Compare a plaintext password with a hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = (password, hash) => bcrypt.compare(password, hash);

/**
 * Validate password complexity. Throws AppError(400) when invalid.
 * @param {string} password
 */
const assertStrongPassword = (password) => {
    if (!password || typeof password !== 'string') {
        throw new AppError('Password is required', 400, { code: 'PASSWORD_REQUIRED' });
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
        throw new AppError(
            `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
            400,
            { code: 'PASSWORD_TOO_SHORT' }
        );
    }
    return true;
};

module.exports = {
    BCRYPT_COST,
    PASSWORD_MIN_LENGTH,
    hashPassword,
    comparePassword,
    assertStrongPassword,
};
