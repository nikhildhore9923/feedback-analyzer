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

async function generateSummary(req, res, next) {
    try {
        const { reviews } = req.body;
        
        if (!reviews || !Array.isArray(reviews)) {
            return res.status(400).json({ success: false, message: 'Invalid reviews data provided' });
        }

        // TODO: Swap this block with your real LLM API call (e.g., Gemini, OpenAI, Claude)
        // const prompt = `Summarize these feedback items into 2 sentences: ${JSON.stringify(reviews)}`;
        // const summary = await llm.generate(prompt);
        
        // Mock LLM Latency
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockSummary = reviews.length > 0
            ? "Customers generally appreciate the recent UI updates and praise the customer support team's responsiveness. However, several users have reported friction with the pricing structure and occasional app crashes on mobile devices."
            : "Not enough data available to generate an executive summary. Please collect more feedback to generate insights.";

        res.json({ success: true, summary: mockSummary });
    } catch (err) {
        next(err);
    }
}

module.exports = { getSentimentTrends, generateSummary };
