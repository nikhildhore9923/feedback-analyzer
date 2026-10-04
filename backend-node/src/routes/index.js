const express = require('express');
const router = express.Router();
const multer = require('multer');

const feedbackController = require('../controllers/feedbackController');
const statsController = require('../controllers/statsController');
const batchController = require('../controllers/batchController');
const settingsController = require('../controllers/settingsController');
const analyticsController = require('../controllers/analyticsController');
const authController = require('../controllers/authController');

// Vercel Serverless environments are read-only except for the /tmp directory.
const upload = multer({ dest: '/tmp/' });

// Auth
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Public Health Check (For UptimeRobot to keep Aiven DB alive)
const db = require('../db/connection');
router.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// Cron (Vercel serverless trigger)
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

// Analytics
router.get('/analytics/trends', analyticsController.getSentimentTrends);
router.post('/analytics/summary', analyticsController.generateSummary);

// Reviews
router.post('/reviews', feedbackController.submitReview);
router.get('/reviews', feedbackController.getReviews);
router.patch('/reviews/:id/status', feedbackController.updateStatus);
router.delete('/reviews/:id', feedbackController.deleteReview);
router.post('/reviews/bulk', upload.single('file'), feedbackController.bulkUpload);

// Stats
router.get('/stats', statsController.getStats);

// Batches
router.get('/batches', batchController.getBatches);

// Settings
router.get('/settings', settingsController.getSettings);
router.post('/settings', settingsController.updateSettings);
router.delete('/settings/clear', settingsController.clearTenantData);

module.exports = router;
