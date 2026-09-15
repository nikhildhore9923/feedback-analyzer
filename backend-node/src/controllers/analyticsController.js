const db = require('../db/connection');

async function getSentimentTrends(req, res, next) {
    try {
        const { days } = req.query; // '7', '30', '90', or 'all'
        
        let query = `
            SELECT 
                DATE(timestamp) as date,
                SUM(CASE WHEN sentiment = 'Positive' THEN 1 ELSE 0 END) as positive,
                SUM(CASE WHEN sentiment = 'Negative' THEN 1 ELSE 0 END) as negative,
                SUM(CASE WHEN sentiment = 'Neutral' THEN 1 ELSE 0 END) as neutral,
                SUM(CASE WHEN priority_score >= 80 THEN 1 ELSE 0 END) as critical,
                SUM(CASE WHEN priority_score >= 60 AND priority_score < 80 THEN 1 ELSE 0 END) as high,
                COUNT(*) as total
            FROM reviews
            WHERE tenant_id = ?
        `;
        const params = [req.tenantId];

        if (days && days !== 'all') {
            const numDays = parseInt(days, 10);
            if (!isNaN(numDays)) {
                query += ` AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)`;
                params.push(numDays);
            }
        }

        query += ` GROUP BY DATE(timestamp) ORDER BY date ASC`;

        const [rows] = await db.query(query, params);
        
        // Also fetch the previous period for comparison if days is a number
        let previousStats = null;
        if (days && days !== 'all') {
            const numDays = parseInt(days, 10);
            if (!isNaN(numDays)) {
                const [prevRows] = await db.query(`
                    SELECT 
                        SUM(CASE WHEN sentiment = 'Negative' THEN 1 ELSE 0 END) as negative,
                        COUNT(*) as total
                    FROM reviews
                    WHERE tenant_id = ? 
                      AND timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
                      AND timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
                `, [req.tenantId, numDays * 2, numDays]);
                
                if (prevRows.length > 0 && prevRows[0].total > 0) {
                    previousStats = {
                        negativeRate: (prevRows[0].negative / prevRows[0].total) * 100
                    };
                }
            }
        }

        res.json({
            trends: rows,
            previousStats
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { getSentimentTrends };
