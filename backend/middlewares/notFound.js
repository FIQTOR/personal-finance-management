/**
 * 404 handler for unknown API routes.
 * Returns JSON instead of Express' default HTML page.
 */
const notFound = (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        data: null,
    });
};

module.exports = notFound;
