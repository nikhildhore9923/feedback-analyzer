const express = require('express');
const router = express.Router();
const multer = require('multer');

const feedbackController = require('../controllers/feedbackController');
const statsController = require('../controllers/statsController');
const batchController = require('../controllers/batchController');
const settingsController = require('../controllers/settingsController');
const analyticsController = require('../controllers/analyticsController');
const authController = require('../controllers/authController');

// Rate Limiters
const {
    authLimiter,
    reviewSubmitLimiter,
    bulkUploadLimiter,
    summaryLimiter
} = require('../middleware/rateLimiter');

// Input Validators
const {
    validateSignup,
    validateLogin,
    validateReviewSubmission,
    validateStatusUpdate,
    validateSummaryRequest,
    validateSettingsUpdate
} = require('../middleware/validate');

// Vercel Serverless environments are read-only except for the /tmp directory.
// Configured with 5MB max file size and CSV extension validation.
const upload = multer({
    dest: '/tmp/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        const ext = (file.originalname || '').toLowerCase();
        if (
            ext.endsWith('.csv') ||
            file.mimetype === 'text/csv' ||
            file.mimetype === 'application/vnd.ms-excel' ||
            file.mimetype === 'text/plain'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file format. Only CSV files (.csv) are supported.'));
        }
    }
});

// Multer error handling wrapper for safe, friendly JSON error responses
const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File size exceeds the maximum limit of 5 MB.' });
            }
            return res.status(400).json({ error: err.message || 'File upload failed.' });
        }
        next();
    });
};

// 1. Auth Routes (Rate Limited & Validated)
router.post('/signup', authLimiter, validateSignup, authController.signup);
router.post('/login', authLimiter, validateLogin, authController.login);

// 2. Public Health Check (For UptimeRobot to keep Aiven DB alive)
const db = require('../db/connection');
router.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// 3. Cron (Vercel serverless trigger)
const { runDailyEvaluation } = require('../cronJobs');
router.get('/cron/daily-alerts', async (req, res, next) => {
    try {
        if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET || 'dev_cron_secret'}`) {
            return res.status(401).json({ error: 'Unauthorized cron trigger' });
        }
        await runDailyEvaluation();
        res.json({ success: true, message: 'Daily evaluation completed' });
    } catch (err) {
        next(err);
    }
});

// 4. Analytics
router.get('/analytics/trends', analyticsController.getSentimentTrends);
router.post('/analytics/summary', summaryLimiter, validateSummaryRequest, analyticsController.generateSummary);

// 5. Reviews
router.post('/reviews', reviewSubmitLimiter, validateReviewSubmission, feedbackController.submitReview);
router.get('/reviews', feedbackController.getReviews);
router.patch('/reviews/:id/status', validateStatusUpdate, feedbackController.updateStatus);
router.delete('/reviews/:id', feedbackController.deleteReview);
router.post('/reviews/bulk', bulkUploadLimiter, handleUpload, feedbackController.bulkUpload);

// 6. Stats
router.get('/stats', statsController.getStats);

// 7. Batches
router.get('/batches', batchController.getBatches);

// 8. Settings
router.get('/settings', settingsController.getSettings);
router.post('/settings', validateSettingsUpdate, settingsController.updateSettings);
router.delete('/settings/clear', settingsController.clearTenantData);

module.exports = router;
