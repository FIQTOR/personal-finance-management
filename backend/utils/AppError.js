/**
 * AppError
 * A typed operational error used across the application so that the central
 * error handler can produce a consistent JSON response.
 */
class AppError extends Error {
    /**
     * @param {string} message - Human readable message sent to the client.
     * @param {number} [statusCode=500] - HTTP status code.
     * @param {object} [options] - Extra options.
     * @param {string} [options.code] - Machine readable error code.
     * @param {any} [options.details] - Additional details (validation errors, etc).
     * @param {boolean} [options.isOperational=true] - Whether the error is expected.
     */
    constructor(message, statusCode = 500, { code, details, isOperational = true } = {}) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
