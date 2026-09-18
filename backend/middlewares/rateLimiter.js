const rateMap = new Map();

const rateLimiter = (options = {}) => {
    const windowMs = options.windowMs || 15 * 60 * 1000;
    const max = options.max || 1000;
    const message = options.message || { success: false, message: 'Too many requests, please try again later.' };

    setInterval(() => {
        const now = Date.now();
        for (const [ip, data] of rateMap.entries()) {
            if (now - data.startTime > windowMs) {
                rateMap.delete(ip);
            }
        }
    }, windowMs);

    return (req, res, next) => {
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const now = Date.now();

        if (!rateMap.has(ip)) {
            rateMap.set(ip, { count: 1, startTime: now });
            return next();
        }

        const data = rateMap.get(ip);
        if (now - data.startTime > windowMs) {
            rateMap.set(ip, { count: 1, startTime: now });
            return next();
        }

        data.count += 1;
        if (data.count > max) {
            res.setHeader('Retry-After', Math.ceil((windowMs - (now - data.startTime)) / 1000));
            return res.status(429).json(message);
        }

        next();
    };
};

module.exports = rateLimiter;
