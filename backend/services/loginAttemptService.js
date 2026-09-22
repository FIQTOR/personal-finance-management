/**
 * Login attempt / IP ban service
 *
 * Tracks failed login attempts per IP and exposes helpers to check bans and
 * reset counters on successful login.
 */
const { Op } = require('sequelize');
const FailedLoginAttempt = require('../models/failedLoginAttempt');

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 3;

/**
 * Get the current failed-attempt record for an IP within the window.
 * @param {string} ipAddress
 */
const getRecentAttempt = (ipAddress) =>
    FailedLoginAttempt.findOne({
        where: {
            ip_address: ipAddress,
            created_at: { [Op.gt]: new Date(Date.now() - WINDOW_MS) },
        },
    });

/**
 * Check whether an IP is currently banned.
 * @param {string} ipAddress
 * @returns {Promise<{ banned: boolean, minutesLeft?: number }>}
 */
const checkBan = async (ipAddress) => {
    const attempt = await getRecentAttempt(ipAddress);
    if (attempt && attempt.attempts >= MAX_ATTEMPTS) {
        const minutesLeft = Math.ceil(
            (attempt.created_at.getTime() + WINDOW_MS - Date.now()) / 1000 / 60
        );
        return { banned: true, minutesLeft: Math.max(minutesLeft, 1) };
    }
    return { banned: false };
};

/**
 * Record a failed login attempt.
 * @param {string} ipAddress
 * @returns {Promise<{ attempts: number, banned: boolean }>}
 */
const recordFailedAttempt = async (ipAddress) => {
    const attempt = await getRecentAttempt(ipAddress);

    if (attempt) {
        const nextAttempts = attempt.attempts + 1;
        await attempt.update({ attempts: nextAttempts });
        return { attempts: nextAttempts, banned: nextAttempts >= MAX_ATTEMPTS };
    }

    await FailedLoginAttempt.create({ ip_address: ipAddress, attempts: 1, created_at: new Date() });
    return { attempts: 1, banned: false };
};

/**
 * Clear failed attempts for an IP (call after a successful login).
 * @param {string} ipAddress
 */
const resetAttempts = (ipAddress) =>
    FailedLoginAttempt.destroy({ where: { ip_address: ipAddress } });

module.exports = {
    WINDOW_MS,
    MAX_ATTEMPTS,
    checkBan,
    recordFailedAttempt,
    resetAttempts,
};
