const feedbackService = require('../services/feedbackService');
const fs = require('fs');

async function submitReview(req, res, next) {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }
        const result = await feedbackService.processSingleFeedback(text, req.tenantId);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function getReviews(req, res, next) {
    try {
        const result = await feedbackService.getReviews(req.query, req.tenantId);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

async function updateStatus(req, res, next) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await feedbackService.updateReviewStatus(id, status, req.tenantId);
        res.json({ message: "Status updated" });
    } catch (err) {
        next(err);
    }
}

async function deleteReview(req, res, next) {
    try {
        const { id } = req.params;
        await feedbackService.deleteReview(id, req.tenantId);
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
                    const batchId = await feedbackService.createCsvBatch(req.file.originalname, req.tenantId);
                    
                    const processed = [];
                    for (const row of results) {
                        let text = row.review || row.Review || row.text || row.Text || row.feedback || row.Feedback;
                        
                        if (!text) {
                            // Smart Fallback: grab the longest string in the row if headers don't match
                            const values = Object.values(row).filter(v => typeof v === 'string');
                            if (values.length > 0) {
                                text = values.sort((a, b) => b.length - a.length)[0];
                            }
                        }

                        if (text && text.trim().length > 0) {
                            // Process and assign to batch
                            const { analyzeFeedback } = require('../services/mlService');
                            const mlResult = await analyzeFeedback(text);
                            const { sentiment, confidence, severity = 0, aspect } = mlResult;
                            
                            let priorityScore = 0;
                            if (sentiment === 'Negative') {
                                priorityScore = Math.round(50 + (confidence * 50));
                            } else if (sentiment === 'Neutral') {
                                priorityScore = Math.round(50 - (confidence * 20));
                            } else {
                                priorityScore = Math.round(30 - (confidence * 20));
                            }
                            
                            const db = require('../db/connection');
                            await db.query(
                                `INSERT INTO reviews (review_text, sentiment, confidence, severity, aspect, batch_id, priority_score, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                [text, sentiment, confidence, severity, aspect, batchId, priorityScore, req.tenantId]
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
