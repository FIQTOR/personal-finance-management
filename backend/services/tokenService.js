/**
 * Token service
 *
 * Single source of truth for issuing JWT access/refresh tokens and creating
 * user sessions. Previously this logic was copy-pasted across four controllers.
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');
const UserSession = require('../models/userSession');
const { hashToken } = require('../utils/tokenHash');

/**
 * Build a minimal JWT payload. Only non-sensitive identifiers are included
 * because JWT payloads are readable by anyone holding the token.
 * @param {object} user
 * @param {object} [role] - role instance/object with `name`.
 */
const buildPayload = (user, role) => ({
    id: user.id,
    role: role?.name || user.role?.name || null,
});

/**
 * Generate a short-lived access token.
 * @param {object} user
 * @param {object} [role]
 * @returns {string}
 */
const generateAccessToken = (user, role) =>
    jwt.sign(buildPayload(user, role), env.ACCESS_TOKEN_SECRET, {
        expiresIn: env.ACCESS_TOKEN_TTL,
    });

/**
 * Generate a refresh token (rememberMe extends the lifetime).
 * @param {object} user
 * @param {object} [role]
 * @param {boolean} [rememberMe]
 * @returns {string}
 */
const generateRefreshToken = (user, role, rememberMe = false) =>
    jwt.sign(buildPayload(user, role), env.REFRESH_TOKEN_SECRET, {
        expiresIn: rememberMe ? env.REFRESH_TOKEN_TTL_REMEMBER : env.REFRESH_TOKEN_TTL,
    });

/**
 * Convert a TTL string (e.g. "30d", "1d") to milliseconds.
 * @param {string} ttl
 * @returns {number}
 */
const ttlToMs = (ttl) => {
    const match = /^(\d+)([smhd])$/.exec(ttl);
    if (!match) return 24 * 60 * 60 * 1000;
    const value = Number(match[1]);
    const unit = match[2];
    const factors = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
    return value * factors[unit];
};

/**
 * Resolve the refresh cookie max age (ms) for a rememberMe choice.
 * @param {boolean} rememberMe
 * @returns {number}
 */
const refreshCookieMaxAge = (rememberMe = false) =>
    ttlToMs(rememberMe ? env.REFRESH_TOKEN_TTL_REMEMBER : env.REFRESH_TOKEN_TTL);

/**
 * Persist a user session. Only the hash of the refresh token is stored so a
 * database leak does not expose usable tokens.
 * @param {object} params
 * @param {number} params.userId
 * @param {string} params.refreshToken
 * @param {object} params.req
 * @param {number} params.expiresAt - epoch ms
 */
const createSession = async ({ userId, refreshToken, req, expiresAt }) => {
    return UserSession.create({
        user_id: userId,
        token_hash: hashToken(refreshToken),
        device_info: req?.headers?.['user-agent'] || null,
        ip_address: req?.ip || null,
        expires_at: new Date(expiresAt),
    });
};

/**
 * Find a session by a plaintext refresh token.
 * @param {string} refreshToken
 */
const findSessionByToken = async (refreshToken) => {
    return UserSession.findOne({ where: { token_hash: hashToken(refreshToken) } });
};

/**
 * Destroy a session by plaintext refresh token.
 * @param {string} refreshToken
 */
const destroySessionByToken = async (refreshToken) => {
    return UserSession.destroy({ where: { token_hash: hashToken(refreshToken) } });
};

/**
 * Destroy every session belonging to a user (e.g. after a password change).
 * @param {number} userId
 */
const destroyAllSessionsForUser = (userId) =>
    UserSession.destroy({ where: { user_id: userId } });

/**
 * Generate a random opaque session identifier (unused placeholder for future).
 * @returns {string}
 */
const randomId = () => crypto.randomBytes(16).toString('hex');

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    refreshCookieMaxAge,
    createSession,
    findSessionByToken,
    destroySessionByToken,
    destroyAllSessionsForUser,
    buildPayload,
    ttlToMs,
    randomId,
};
