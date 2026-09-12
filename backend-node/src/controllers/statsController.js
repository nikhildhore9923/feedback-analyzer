const db = require('../db/connection');

async function getStats(req, res, next) {
    try {
        const [rows] = await db.query(
            `SELECT sentiment, COUNT(*) as count FROM reviews GROUP BY sentiment`
        );
        res.json(rows);
    } catch (err) {
        next(err);
    }
}

module.exports = { getStats };
