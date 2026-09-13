const db = require('../db/connection');
const { analyzeFeedback } = require('./mlService');
const { sendAlertEmail } = require('../utils/mailer');

async function getAlertThreshold() {
    const [rows] = await db.query(`SELECT setting_value FROM settings WHERE setting_key = 'alert_threshold'`);
    if (rows.length > 0) {
        return parseFloat(rows[0].setting_value);
    }
    return -0.5; // default fallback
}

/**
 * Creates or retrieves today's manual batch using INSERT IGNORE to prevent race conditions.
 */
async function getOrCreateManualBatch() {
    const today = new Date().toISOString().slice(0, 10); // UTC date string
    const label = `Manual entries — ${today}`;
    
    // Insert if not exists (UNIQUE constraint on label prevents duplicates concurrently)
    await db.query(`INSERT IGNORE INTO batches (label, type) VALUES (?, 'manual')`, [label]);
    
    // Retrieve the id
    const [rows] = await db.query(`SELECT id FROM batches WHERE label = ?`, [label]);
    return rows[0].id;
}

async function createCsvBatch(filename) {
    const label = `${filename} — ${new Date().toISOString()}`;
    // No IGNORE here, we want it to fail if it's a duplicate label somehow, but it has timestamp so it's unique
    const [result] = await db.query(`INSERT INTO batches (label, type) VALUES (?, 'csv')`, [label]);
    return result.insertId;
}

async function processSingleFeedback(text) {
    // 1. ML Analysis
    const mlResult = await analyzeFeedback(text);
    const { sentiment, confidence, severity = 0, aspect } = mlResult;

    let priorityScore = 0;
    if (sentiment === 'Negative') {
        priorityScore = confidence * (severity || 1) * 10;
    }

    // 3. Batch Retrieval
    const batchId = await getOrCreateManualBatch();

    // 4. Save to DB first so we have the ID
    const [result] = await db.query(
        `INSERT INTO reviews 
        (review_text, sentiment, confidence, severity, aspect, alert_sent, batch_id, priority_score) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [text, sentiment, confidence, severity, aspect, false, batchId, priorityScore]
    );
    const reviewId = result.insertId;

    // 5. Alert Logic (Async so it doesn't block UI)
    const threshold = await getAlertThreshold();
    let alertSent = false;
    if (sentiment === 'Negative') {
        const mockPolarity = -1 * (confidence || 1); 
        if (mockPolarity < threshold) {
            sendAlertEmail(text, sentiment, confidence, severity, aspect)
                .then(sent => {
                    if (sent) db.query(`UPDATE reviews SET alert_sent = 1 WHERE id = ?`, [reviewId]);
                }).catch(() => {});
        }
    }

    return {
        id: reviewId,
        text,
        sentiment,
        confidence,
        severity,
        aspect,
        alertSent: false, // UI won't show it immediately, but it will appear on next refresh
        batchId,
        status: 'New',
        priorityScore
    };
}

async function getReviews(queryParams) {
    const { search, sentiment, aspect, status, batch_id, page = 1, limit = 50 } = queryParams;
    let query = `SELECT r.*, b.type as batch_type, b.label as batch_label FROM reviews r LEFT JOIN batches b ON r.batch_id = b.id WHERE 1=1`;
    const params = [];

    if (search) {
        query += ` AND r.review_text LIKE ?`;
        params.push(`%${search}%`);
    }
    if (sentiment) {
        query += ` AND r.sentiment = ?`;
        params.push(sentiment);
    }
    if (aspect) {
        query += ` AND r.aspect = ?`;
        params.push(aspect);
    }
    if (status) {
        query += ` AND r.status = ?`;
        params.push(status);
    }
    if (queryParams.batch_type) {
        query += ` AND b.type = ?`;
        params.push(queryParams.batch_type);
    }
    if (batch_id) {
        query += ` AND r.batch_id = ?`;
        params.push(Number(batch_id));
    }

    query += ` ORDER BY r.timestamp DESC`;

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const [rows] = await db.query(query, params);
    
    // Get total count for pagination metadata
    let countQuery = `SELECT COUNT(*) as total FROM reviews r LEFT JOIN batches b ON r.batch_id = b.id WHERE 1=1`;
    const countParams = params.slice(0, params.length - 2); // remove limit and offset
    const searchMatch = query.match(/AND r\.review_text LIKE \?/);
    if(searchMatch) countQuery += ` AND r.review_text LIKE ?`;
    if(sentiment) countQuery += ` AND r.sentiment = ?`;
    if(aspect) countQuery += ` AND r.aspect = ?`;
    if(status) countQuery += ` AND r.status = ?`;
    if(queryParams.batch_type) countQuery += ` AND b.type = ?`;
    if(batch_id) countQuery += ` AND r.batch_id = ?`;

    const [countRows] = await db.query(countQuery, countParams);

    return {
        data: rows,
        meta: {
            total: countRows[0].total,
            page: Number(page),
            limit: Number(limit)
        }
    };
}

async function updateReviewStatus(id, status) {
    const validStatuses = ['New', 'Reviewing', 'Resolved', 'Ignored'];
    if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
    }
    const [result] = await db.query(`UPDATE reviews SET status = ? WHERE id = ?`, [status, id]);
    return result.affectedRows > 0;
}

async function deleteReview(id) {
    const [result] = await db.query(`DELETE FROM reviews WHERE id = ?`, [id]);
    return result.affectedRows > 0;
}

module.exports = {
    processSingleFeedback,
    getReviews,
    updateReviewStatus,
    deleteReview,
    getAlertThreshold,
    createCsvBatch
};
