/**
 * Refresh-token cookie helpers.
 *
 * The refresh token is stored in an httpOnly cookie. The same attributes are
 * used to set and clear it so browsers always treat it as one cookie.
 */
const env = require('../config/env');

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_PATH = '/';

/**
 * Build the cookie options for the refresh token.
 * @param {number} [maxAge] - Cookie max age in milliseconds.
 */
const buildCookieOptions = (maxAge) => {
    const options = {
        httpOnly: true,
        secure: env.COOKIE_SECURE,
        // 'none' requires secure=true. In development (http) use 'lax'.
        sameSite: env.COOKIE_SECURE ? 'none' : 'lax',
        path: REFRESH_COOKIE_PATH,
    };

    if (env.COOKIE_DOMAIN) {
        options.domain = env.COOKIE_DOMAIN;
    }

    if (typeof maxAge === 'number') {
        options.maxAge = maxAge;
    }

    return options;
};

/**
 * Set the refresh token cookie.
 * @param {import('express').Response} res
 * @param {string} token
 * @param {number} maxAge
 */
const setRefreshCookie = (res, token, maxAge) => {
    res.cookie(REFRESH_COOKIE_NAME, token, buildCookieOptions(maxAge));
};

/**
 * Clear the refresh token cookie.
 * @param {import('express').Response} res
 */
const clearRefreshCookie = (res) => {
    const options = buildCookieOptions();
    delete options.maxAge;
    res.clearCookie(REFRESH_COOKIE_NAME, options);
};

/**
 * Read the refresh token from the request cookies.
 * @param {import('express').Request} req
 * @returns {string|undefined}
 */
const getRefreshCookie = (req) => req.cookies?.[REFRESH_COOKIE_NAME];

module.exports = {
    REFRESH_COOKIE_NAME,
    setRefreshCookie,
    clearRefreshCookie,
    getRefreshCookie,
};
