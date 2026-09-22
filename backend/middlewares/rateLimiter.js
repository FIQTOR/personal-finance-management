/**
 * In-memory rate limiter middleware.
 *
 * NOTE: this is suitable for a single instance / development. For multi-instance
 * deployments behind a load balancer, replace the store with Redis
 * (see `rate-limit-redis`). `trust proxy` must be configured on the app so that
 * `req.ip` resolves to the real client IP rather than a spoofable header.
 *
 * The cleanup interval is `.unref()`ed so it never keeps the process alive.
 */
const rateLimiter = (options = {}) => {
    const windowMs = options.windowMs || 15 * 60 * 1000;
    const max = options.max || 1000;
    const message = options.message || {
        success: false,
        message: 'Too many requests, please try again later.',
    };

    const rateMap = new Map();

    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [key, data] of rateMap.entries()) {
            if (now - data.startTime > windowMs) rateMap.delete(key);
        }
    }, windowMs);
    if (typeof cleanup.unref === 'function') cleanup.unref();

    return (req, res, next) => {
        // Trust Express' resolved req.ip (requires correct `trust proxy` setting)
        // instead of reading X-Forwarded-For directly, which is spoofable.
        const key = req.ip || req.socket?.remoteAddress || 'unknown';
        const now = Date.now();

        const data = rateMap.get(key);

        if (!data || now - data.startTime > windowMs) {
            rateMap.set(key, { count: 1, startTime: now });
            return next();
        }

        data.count += 1;
        if (data.count > max) {
            res.setHeader('Retry-After', Math.ceil((windowMs - (now - data.startTime)) / 1000));
            return res.status(429).json(message);
        }

        return next();
    };
};

module.exports = rateLimiter;
