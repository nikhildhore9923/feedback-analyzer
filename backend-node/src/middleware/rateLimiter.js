const rateLimit = require('express-rate-limit');

/**
 * Common standard response for rate-limited requests
 */
const rateLimitHandler = (req, res, next, options) => {
    res.status(options.statusCode || 429).json({
        success: false,
        message: options.message || 'Too many requests. Please slow down and try again later.'
    });
};

// 1. Auth Limiter (Signup / Login)
// Allows up to 30 attempts per 15 minutes per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    handler: rateLimitHandler
});

// 2. Single Review Submission Limiter
// Allows up to 60 review submissions per minute per IP
const reviewSubmitLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Feedback submission rate limit reached. Please wait a moment before sending more reviews.',
    handler: rateLimitHandler
});

// 3. Bulk Upload Limiter
// Protects against large file flooding; allows 10 bulk uploads per 15 minutes
const bulkUploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Bulk CSV upload rate limit reached. Please wait before uploading another batch.',
    handler: rateLimitHandler
});

// 4. Generative AI Summary Limiter
// Protects Groq API quota; allows up to 20 summary requests per 10 minutes
const summaryLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'AI summary request limit reached. Please wait a few minutes before generating more insights.',
    handler: rateLimitHandler
});

module.exports = {
    authLimiter,
    reviewSubmitLimiter,
    bulkUploadLimiter,
    summaryLimiter
};
