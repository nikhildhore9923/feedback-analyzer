const feedbackService = require('../services/feedbackService');
const fs = require('fs');

async function submitReview(req, res, next) {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }
        const result = await feedbackService.processSingleFeedback(text);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getReviews(req, res, next) {
    try {
        const result = await feedbackService.getReviews(req.query);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function updateStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await feedbackService.updateReviewStatus(id, status);
        res.json({ message: "Status updated" });
    } catch (err) {
        next(err);
    }
}

async function deleteReview(req, res, next) {
    try {
        const { id } = req.params;
        await feedbackService.deleteReview(id);
        res.json({ message: "Review deleted" });
    } catch (err) {
        next(err);
    }
}

async function bulkUpload(req, res, next) {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "CSV file is required" });
        }
        const csvParser = require('csv-parser');
        const results = [];
        
        fs.createReadStream(req.file.path)
            .pipe(csvParser())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    // Create a CSV batch
                    const batchId = await feedbackService.createCsvBatch(req.file.originalname);
                    
                    const processed = [];
                    for (const row of results) {
                        const text = row.review || row.Review || row.text || row.Text;
                        if (text) {
                            // Process and assign to batch (slightly modifying processSingleFeedback or bypassing it)
                            // For simplicity, we just use the mlService directly here, or modify processSingleFeedback
                            // to accept an optional batchId. Let's do it cleanly:
                            const { analyzeFeedback } = require('../services/mlService');
                            const mlResult = await analyzeFeedback(text);
                            const { sentiment, confidence, severity = 0, aspect } = mlResult;
                            
                            const db = require('../db/connection');
                            await db.query(
                                `INSERT INTO reviews (review_text, sentiment, confidence, severity, aspect, batch_id) VALUES (?, ?, ?, ?, ?, ?)`,
                                [text, sentiment, confidence, severity, aspect, batchId]
                            );
                            processed.push({ text, sentiment });
                        }
                    }
                    fs.unlinkSync(req.file.path);
                    res.json({ message: "Bulk upload successful", processed: processed.length });
                } catch (err) {
                    fs.unlinkSync(req.file.path);
                    next(err);
                }
            });
    } catch (err) {
        next(err);
    }
}

module.exports = { submitReview, getReviews, updateStatus, deleteReview, bulkUpload };
