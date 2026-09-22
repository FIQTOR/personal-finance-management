/**
 * Request logger middleware.
 *
 * In development it prints a colourised one-liner per request. In production it
 * emits a single structured JSON line per request (easy to ingest by log
 * aggregators) instead of noisy coloured text.
 */
const env = require('../config/env');

const logger = (req, res, next) => {
    if (env.NODE_ENV === 'test') return next();

    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl, ip } = req;
        const status = res.statusCode;

        if (env.isProduction) {
            // eslint-disable-next-line no-console
            console.log(JSON.stringify({
                ts: new Date().toISOString(),
                method,
                url: originalUrl,
                status,
                duration_ms: duration,
                ip,
            }));
            return;
        }

        const statusColor =
            status >= 500 ? '\x1b[31m'
                : status >= 400 ? '\x1b[33m'
                    : status >= 300 ? '\x1b[36m'
                        : '\x1b[32m';
        const reset = '\x1b[0m';
        // eslint-disable-next-line no-console
        console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} ${statusColor}${status}${reset} - ${duration}ms (${ip})`);
    });

    next();
};

module.exports = logger;
