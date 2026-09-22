/**
 * asyncHandler
 * Wraps async route handlers so that rejected promises are forwarded to the
 * central error handler via `next(err)` instead of crashing the process.
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
