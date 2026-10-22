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

// 9. Admin Maintenance Seed Route (Cleans automated test spam & restores balanced benchmark data)
router.post('/admin/seed-demo', async (req, res, next) => {
    try {
        const { secret } = req.body;
        if (secret !== 'pulse_demo_seed_2026') {
            return res.status(401).json({ error: 'Unauthorized maintenance seed trigger' });
        }
        const db = require('../db/connection');

        // 1. Purge automated test spam and repetitive stress-test reviews
        await db.query(`
            DELETE FROM reviews 
            WHERE review_text LIKE '%Automated stress test review%' 
               OR review_text LIKE '%[Automated Test%'
        `);

        // 2. High-quality realistic customer feedback entries across all 5 operational aspects
        const benchmarkReviews = [
            { text: "The updated checkout experience is blazing fast and our order arrived two days ahead of schedule! Truly exceptional service.", sentiment: "Positive", aspect: "Delivery", priority: 12 },
            { text: "The mobile application crashes intermittently whenever I try to edit payment details on iOS 17. Please patch this bug.", sentiment: "Negative", aspect: "App/Website", priority: 85 },
            { text: "Customer support answered within three minutes and resolved our billing dispute immediately. Very courteous team.", sentiment: "Positive", aspect: "Customer Service", priority: 10 },
            { text: "Product build quality is solid, but the monthly subscription pricing tiers are slightly high for small businesses.", sentiment: "Neutral", aspect: "Pricing", priority: 45 },
            { text: "Package arrived with damaged outer packaging and one accessory missing. Frustrated with carrier handling.", sentiment: "Negative", aspect: "Delivery", priority: 90 },
            { text: "Intuitive dashboard interface and instant search filtering across large datasets. Streamlined our daily operations.", sentiment: "Positive", aspect: "App/Website", priority: 14 },
            { text: "Standard build quality that meets basic expectations. Nothing groundbreaking, but it gets the job done reliably.", sentiment: "Neutral", aspect: "Product Quality", priority: 35 },
            { text: "Submitted a technical inquiry four days ago and have not received an acknowledgment or ticket update from support.", sentiment: "Negative", aspect: "Customer Service", priority: 78 },
            { text: "The platform onboarding walkthrough made team rollout seamless. Great experience overall.", sentiment: "Positive", aspect: "App/Website", priority: 15 },
            { text: "Fair pricing structure for the features offered. Transparent invoices and reliable notifications.", sentiment: "Positive", aspect: "Pricing", priority: 20 },
            { text: "The product itself is of very good quality, and the material durable for high-frequency daily use.", sentiment: "Positive", aspect: "Product Quality", priority: 15 },
            { text: "Order arrived on time, but communication regarding the shipment tracking numbers was somewhat ambiguous.", sentiment: "Neutral", aspect: "Delivery", priority: 42 }
        ];

        for (let i = 0; i < benchmarkReviews.length; i++) {
            const item = benchmarkReviews[i];
            const hoursAgo = Math.floor(i * 5 + Math.random() * 4); // Spread over past 3 days
            await db.query(`
                INSERT INTO reviews (tenant_id, review_text, sentiment, confidence, aspect, priority_score, status, timestamp)
                VALUES ('demo-tenant-123', ?, ?, 0.94, ?, ?, 'New', NOW() - INTERVAL ? HOUR)
            `, [item.text, item.sentiment, item.aspect, item.priority, hoursAgo]);
        }

        res.json({ success: true, message: 'Automated test spam purged. Balanced benchmark feedback successfully seeded.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
