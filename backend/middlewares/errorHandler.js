/**
 * Central error handler middleware.
 *
 * Produces a consistent `{ success, message, data }` error response. Internal
 * error details are logged server-side but never leaked to the client unless
 * the error is an operational AppError.
 */
const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let error = err;

    // Normalise known Sequelize errors into operational errors.
    if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors?.[0]?.path;
        error = new AppError(
            field ? `${field} already exists` : 'Duplicate value',
            409,
            { code: 'DUPLICATE' }
        );
    } else if (error.name === 'SequelizeValidationError') {
        error = new AppError(
            'Validation error',
            400,
            { code: 'VALIDATION_ERROR', details: error.errors?.map((e) => e.message) }
        );
    }

    if (!(error instanceof AppError)) {
        error = new AppError('Internal server error', error.statusCode || 500, {
            isOperational: false,
        });
    }

    // Log full detail server-side.
    // eslint-disable-next-line no-console
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${error.statusCode}: ${err.message}`);

    const body = {
        success: false,
        message: error.message,
        data: null,
    };

    if (error.code) body.code = error.code;
    if (error.details) body.errors = error.details;
    // Only expose the stack when explicitly debugging (never by default).
    if (process.env.DEBUG_ERRORS === 'true' && error.stack) body.stack = error.stack;

    return res.status(error.statusCode || 500).json(body);
};

module.exports = errorHandler;
