const db = require('../db/connection');

async function getBatches(req, res, next) {
    try {
        const [rows] = await db.query(`
            SELECT b.id, b.label, b.type, b.created_at, COUNT(r.id) as review_count
            FROM batches b
            LEFT JOIN reviews r ON r.batch_id = b.id
            WHERE b.tenant_id = ?
            GROUP BY b.id
            ORDER BY b.created_at DESC
        `, [req.tenantId]);
        res.json(rows);
    } catch (err) {
        next(err);
    }
}

module.exports = { getBatches };
