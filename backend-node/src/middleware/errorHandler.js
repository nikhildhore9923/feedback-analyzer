function errorHandler(err, req, res, next) {
    console.error('[Error]', err.message);
    
    // Default to 500 server error
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
        error: {
            message,
            status
        }
    });
}

module.exports = errorHandler;
