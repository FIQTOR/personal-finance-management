const logger = (req, res, next) => {
    const start = Date.now();
    const { method, originalUrl, ip } = req;

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : status >= 300 ? '\x1b[36m' : '\x1b[32m';
        const reset = '\x1b[0m';
        console.log(`[${new Date().toISOString()}] ${method} ${originalUrl} ${statusColor}${status}${reset} - ${duration}ms (${ip})`);
    });

    next();
};

module.exports = logger;
