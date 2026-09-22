/**
 * Auth service
 *
 * High level flows that combine token signing, session persistence and cookie
 * handling. Controllers call these instead of re-implementing the logic.
 */
const tokenService = require('./tokenService');
const { setRefreshCookie, clearRefreshCookie } = require('../utils/cookies');

/**
 * Issue an access token + refresh token, persist the session and set the
 * refresh cookie on the response.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {object} user - user instance (must include `role` association).
 * @param {object} [options]
 * @param {boolean} [options.rememberMe=false]
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const issueTokens = async (req, res, user, { rememberMe = false } = {}) => {
    const role = user.role;

    const accessToken = tokenService.generateAccessToken(user, role);
    const refreshToken = tokenService.generateRefreshToken(user, role, rememberMe);

    const maxAge = tokenService.refreshCookieMaxAge(rememberMe);

    await tokenService.createSession({
        userId: user.id,
        refreshToken,
        req,
        expiresAt: Date.now() + maxAge,
    });

    setRefreshCookie(res, refreshToken, maxAge);

    return { accessToken, refreshToken };
};

/**
 * Clear the refresh cookie (used on logout / invalid session).
 * @param {import('express').Response} res
 */
const clearSessionCookie = (res) => clearRefreshCookie(res);

module.exports = { issueTokens, clearSessionCookie };
