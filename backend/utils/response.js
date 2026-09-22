/**
 * Centralised success response helper.
 * Keeps the API contract `{ success, message, data }` consistent everywhere.
 */
const success = (res, { statusCode = 200, message = 'Success', data = null } = {}) => {
    return res.status(statusCode).json({ success: true, message, data });
};

module.exports = { success };
