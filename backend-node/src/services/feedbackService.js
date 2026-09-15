const db = require('../db/connection');
const { analyzeFeedback } = require('./mlService');
const { sendAlertEmail } = require('../utils/mailer');

async function getAlertThreshold(tenantId = 'default') {
    const [rows] = await db.query(`SELECT setting_value FROM settings WHERE setting_key = 'alert_threshold' AND tenant_id = ?`, [tenantId]);
    if (rows.length > 0) {
        return parseFloat(rows[0].setting_value);
    }
    return -0.5; // default fallback
}

/**
 * Creates or retrieves today's manual batch using INSERT IGNORE to prevent race conditions.
 */
async function getOrCreateManualBatch(tenantId = 'default') {
    const today = new Date().toISOString().slice(0, 10); // UTC date string
    const label = `Manual entries - ${today}`;
    
    // Insert if not exists (UNIQUE constraint on label+tenant prevents duplicates concurrently)
    await db.query(`INSERT IGNORE INTO batches (label, type, tenant_id) VALUES (?, 'manual', ?)`, [label, tenantId]);
    
    // Retrieve the id
    const [rows] = await db.query(`SELECT id FROM batches WHERE label = ? AND tenant_id = ?`, [label, tenantId]);
    return rows[0].id;
}

async function createCsvBatch(filename, tenantId = 'default') {
    const label = `${filename} - ${new Date().toISOString()}`;
    const [result] = await db.query(`INSERT INTO batches (label, type, tenant_id) VALUES (?, 'csv', ?)`, [label, tenantId]);
    return result.insertId;
}

async function processSingleFeedback(text, tenantId = 'default') {
    // 1. ML Analysis
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

    // 3. Batch Retrieval
    const batchId = await getOrCreateManualBatch(tenantId);

    // 4. Save to DB first so we have the ID
    const [result] = await db.query(
        `INSERT INTO reviews 
        (review_text, sentiment, confidence, severity, aspect, alert_sent, batch_id, priority_score, tenant_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [text, sentiment, confidence, severity, aspect, false, batchId, priorityScore, tenantId]
    );
    const reviewId = result.insertId;

    // 5. Alert Logic (Async so it doesn't block UI)
    const threshold = await getAlertThreshold(tenantId);
    let alertSent = false;
    if (sentiment === 'Negative') {
        const mockPolarity = -1 * (confidence || 1); 
        // Trigger alert if it meets the user's custom threshold OR if it's inherently a Critical priority (>=80)
        if (mockPolarity < threshold || priorityScore >= 80) {
            sendAlertEmail(text, sentiment, confidence, severity, aspect, tenantId)
                .then(sent => {
                    if (sent) db.query(`UPDATE reviews SET alert_sent = 1 WHERE id = ? AND tenant_id = ?`, [reviewId, tenantId]);
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
        alertSent: false,
        batchId,
        status: 'New',
        priorityScore
    };
}

async function getReviews(queryParams, tenantId = 'default') {
    const { search, sentiment, aspect, status, batch_id, page = 1, limit = 50 } = queryParams;
    let query = `SELECT r.*, b.type as batch_type, b.label as batch_label FROM reviews r LEFT JOIN batches b ON r.batch_id = b.id WHERE r.tenant_id = ?`;
    const params = [tenantId];

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
    if (queryParams.priority) {
        if (queryParams.priority === 'Critical') query += ` AND r.priority_score >= 80`;
        else if (queryParams.priority === 'High') query += ` AND r.priority_score >= 60 AND r.priority_score < 80`;
        else if (queryParams.priority === 'Medium') query += ` AND r.priority_score >= 40 AND r.priority_score < 60`;
        else if (queryParams.priority === 'Low') query += ` AND r.priority_score < 40`;
    }

    query += ` ORDER BY r.timestamp DESC`;

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(Number(limit), offset);

    const [rows] = await db.query(query, params);
    
    // Get total count for pagination metadata
    let countQuery = `SELECT COUNT(*) as total FROM reviews r LEFT JOIN batches b ON r.batch_id = b.id WHERE r.tenant_id = ?`;
    const countParams = [tenantId];
    if(search) { countQuery += ` AND r.review_text LIKE ?`; countParams.push(`%${search}%`); }
    if(sentiment) { countQuery += ` AND r.sentiment = ?`; countParams.push(sentiment); }
    if(aspect) { countQuery += ` AND r.aspect = ?`; countParams.push(aspect); }
    if(status) { countQuery += ` AND r.status = ?`; countParams.push(status); }
    if(queryParams.batch_type) { countQuery += ` AND b.type = ?`; countParams.push(queryParams.batch_type); }
    if(batch_id) { countQuery += ` AND r.batch_id = ?`; countParams.push(Number(batch_id)); }
    if (queryParams.priority) {
        if (queryParams.priority === 'Critical') countQuery += ` AND r.priority_score >= 80`;
        else if (queryParams.priority === 'High') countQuery += ` AND r.priority_score >= 60 AND r.priority_score < 80`;
        else if (queryParams.priority === 'Medium') countQuery += ` AND r.priority_score >= 40 AND r.priority_score < 60`;
        else if (queryParams.priority === 'Low') countQuery += ` AND r.priority_score < 40`;
    }

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

async function updateReviewStatus(id, status, tenantId = 'default') {
    const validStatuses = ['New', 'Reviewing', 'Resolved', 'Ignored'];
    if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
    }
    const [result] = await db.query(`UPDATE reviews SET status = ? WHERE id = ? AND tenant_id = ?`, [status, id, tenantId]);
    return result.affectedRows > 0;
}

async function deleteReview(id, tenantId = 'default') {
    const [result] = await db.query(`DELETE FROM reviews WHERE id = ? AND tenant_id = ?`, [id, tenantId]);
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
