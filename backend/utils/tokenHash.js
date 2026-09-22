/**
 * Password reset & email verification token utilities.
 *
 * Plaintext tokens are emailed to the user, but only a SHA-256 hash is stored
 * in the database. This mirrors how the refresh token is handled: a database
 * leak does not expose usable tokens.
 */
const crypto = require('crypto');

/**
 * Generate a random URL-safe token.
 * @param {number} [bytes=32]
 * @returns {string} hex encoded token
 */
const generateToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

/**
 * Hash a token for storage / lookup.
 * @param {string} token
 * @returns {string} hex encoded sha256 digest
 */
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

module.exports = { generateToken, hashToken };
