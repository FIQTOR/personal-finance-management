/**
 * Backwards-compatible entry point.
 *
 * Route definitions now live in ./routes. This file simply re-exports the
 * aggregated API router so existing imports (`require('./routes')`) keep working.
 */
module.exports = require('./routes/index.js');
