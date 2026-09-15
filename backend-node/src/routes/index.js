const express = require('express');
const router = express.Router();
const multer = require('multer');

const feedbackController = require('../controllers/feedbackController');
const statsController = require('../controllers/statsController');
const batchController = require('../controllers/batchController');
const settingsController = require('../controllers/settingsController');
const analyticsController = require('../controllers/analyticsController');

const upload = multer({ dest: 'uploads/' });

// Analytics
router.get('/analytics/trends', analyticsController.getSentimentTrends);

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
