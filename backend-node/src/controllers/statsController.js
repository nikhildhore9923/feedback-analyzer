const db = require('../db/connection');

async function getStats(req, res, next) {
    try {
        const [rows] = await db.query(
            `SELECT sentiment, COUNT(*) as count FROM reviews WHERE tenant_id = ? GROUP BY sentiment`, [req.tenantId]
        );
        res.json(rows);
    } catch (err) {
        next(err);
    }
}

module.exports = { getStats };
