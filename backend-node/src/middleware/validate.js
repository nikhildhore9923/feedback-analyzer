/**
 * Input validation middleware for Pulse API endpoints.
 * Validates request bodies and parameters, returning clean, helpful error messages
 * without leaking internal server details.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_STATUSES = ['New', 'Reviewing', 'Resolved', 'Ignored'];

function validateSignup(req, res, next) {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
            success: false,
            message: 'Please provide a valid email address.'
        });
    }

    if (email.trim().length > 255) {
        return res.status(400).json({
            success: false,
            message: 'Email address cannot exceed 255 characters.'
        });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Password must be at least 6 characters long.'
        });
    }

    if (password.length > 128) {
        return res.status(400).json({
            success: false,
            message: 'Password cannot exceed 128 characters.'
        });
    }

    req.body.email = email.trim().toLowerCase();
    next();
}

function validateLogin(req, res, next) {
    const { email, password } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Email address is required.'
        });
    }

    if (!password || typeof password !== 'string' || !password) {
        return res.status(400).json({
            success: false,
            message: 'Password is required.'
        });
    }

    req.body.email = email.trim().toLowerCase();
    next();
}

function validateReviewSubmission(req, res, next) {
    const { text } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({
            error: 'Review text cannot be empty.'
        });
    }

    const trimmed = text.trim();
    if (trimmed.length > 5000) {
        return res.status(400).json({
            error: 'Review text cannot exceed 5000 characters.'
        });
    }

    req.body.text = trimmed;
    next();
}

function validateStatusUpdate(req, res, next) {
    const { id } = req.params;
    const { status } = req.body || {};

    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || numericId <= 0) {
        return res.status(400).json({
            error: 'Invalid review ID.'
        });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            error: `Status must be one of: ${VALID_STATUSES.join(', ')}.`
        });
    }

    next();
}

function validateSummaryRequest(req, res, next) {
    const { reviews } = req.body || {};

    if (!reviews || !Array.isArray(reviews)) {
        return res.status(400).json({
            success: false,
            message: 'A valid array of reviews is required.'
        });
    }

    if (reviews.length > 100) {
        // Enforce safe batch size for AI summary prompt
        req.body.reviews = reviews.slice(0, 100);
    }

    next();
}

function validateSettingsUpdate(req, res, next) {
    const { alertThreshold, alertTo } = req.body || {};

    if (alertThreshold !== undefined) {
        const threshold = parseFloat(alertThreshold);
        if (isNaN(threshold) || threshold > 0 || threshold < -1) {
            return res.status(400).json({
                error: 'Alert threshold must be a number between -1.0 and 0.0.'
            });
        }
    }

    if (alertTo !== undefined && alertTo.trim() !== '') {
        if (!EMAIL_REGEX.test(alertTo.trim())) {
            return res.status(400).json({
                error: 'Recipient email address is invalid.'
            });
        }
    }

    next();
}

module.exports = {
    validateSignup,
    validateLogin,
    validateReviewSubmission,
    validateStatusUpdate,
    validateSummaryRequest,
    validateSettingsUpdate,
    validateSettings: validateSettingsUpdate
};
