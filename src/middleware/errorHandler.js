module.exports = (err, req, res, next) => {
    // If response already started, delegate to Express default handler
    if (res.headersSent) return next(err);

    // Default
    const status = err.status || 500;

    // Friendly message
    const message =
        err.message || "Internal Server Error";

    res.status(status).json({ error: message });
};