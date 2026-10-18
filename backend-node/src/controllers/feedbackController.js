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
        const tid = req.tenantId;
        const isDemo = (
            tid === 'demo-tenant-123' ||
            tid === 'tenant_123' ||
            req.user?.email === 'admin@pulse.com'
        );

        if (isDemo) {
            return res.status(403).json({
                error: "Deleting feedback records is disabled in demo mode to protect sample data for evaluators."
            });
        }

        const deleted = await feedbackService.deleteReview(id, tid);
        if (!deleted) {
            return res.status(404).json({ error: "Review not found or unauthorized" });
        }
        res.json({ message: "Review deleted" });
    } catch (err) {
        next(err);
    }
}

async function bulkUpload(req, res, next) {
    if (!req.file) {
        return res.status(400).json({ error: "CSV file is required" });
    }

    const filePath = req.file.path;
    const cleanupFile = () => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (e) {
            console.error('[bulkUpload] Failed to unlink temp file:', e.message);
        }
    };

    try {
        const csvParser = require('csv-parser');
        const results = [];
        const MAX_ROWS = 200;
        
        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => {
                results.push(data);
            })
            .on('error', (streamErr) => {
                cleanupFile();
                return res.status(400).json({ error: `Failed to parse CSV file: ${streamErr.message}` });
            })
            .on('end', async () => {
                try {
                    if (results.length === 0) {
                        cleanupFile();
                        return res.status(400).json({ error: "The uploaded CSV file is empty." });
                    }

                    if (results.length > MAX_ROWS) {
                        cleanupFile();
                        return res.status(400).json({ 
                            error: `CSV contains ${results.length} rows. Maximum allowed per upload is ${MAX_ROWS} rows for real-time analysis. Please upload in smaller batches.` 
                        });
                    }

                    // Create a CSV batch
                    const batchId = await feedbackService.createCsvBatch(req.file.originalname, req.tenantId);
                    const processed = [];
                    const db = require('../db/connection');
                    const { analyzeFeedback } = require('../services/mlService');

                    for (const row of results) {
                        try {
                            let text = row.review || row.Review || row.text || row.Text || row.feedback || row.Feedback;
                            
                            if (!text) {
                                // Smart Fallback: grab the longest string in the row if headers don't match standard names
                                const values = Object.values(row).filter(v => typeof v === 'string');
                                if (values.length > 0) {
                                    text = values.sort((a, b) => b.length - a.length)[0];
                                }
                            }

                            if (text && typeof text === 'string' && text.trim().length > 0) {
                                const cleanText = text.trim().slice(0, 5000);
                                
                                // Run ML or fallback
                                const mlResult = await analyzeFeedback(cleanText);
                                const { sentiment, confidence, severity = 0, aspect } = mlResult;
                                
                                let priorityScore = 0;
                                if (sentiment === 'Negative') {
                                    priorityScore = Math.round(50 + (confidence * 50));
                                } else if (sentiment === 'Neutral') {
                                    priorityScore = Math.round(50 - (confidence * 20));
                                } else {
                                    priorityScore = Math.round(30 - (confidence * 20));
                                }
                                
                                await db.query(
                                    `INSERT INTO reviews (review_text, sentiment, confidence, severity, aspect, batch_id, priority_score, tenant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [cleanText, sentiment, confidence, severity, aspect, batchId, priorityScore, req.tenantId]
                                );
                                processed.push({ text: cleanText, sentiment });
                            }
                        } catch (rowError) {
                            console.warn('[bulkUpload] Skipping malformed row:', rowError.message);
                        }
                    }

                    cleanupFile();
                    res.json({ 
                        success: true, 
                        message: "Bulk upload processed successfully", 
                        processed: processed.length,
                        totalRows: results.length
                    });
                } catch (err) {
                    cleanupFile();
                    next(err);
                }
            });
    } catch (err) {
        cleanupFile();
        next(err);
    }
}

module.exports = { submitReview, getReviews, updateStatus, deleteReview, bulkUpload };
