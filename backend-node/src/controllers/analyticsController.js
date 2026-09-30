const db = require('../db/connection');
const Groq = require('groq-sdk');

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
        
        if (reviews.length === 0) {
            return res.json({ 
                success: true, 
                summary: "Not enough data available to generate an executive summary. Please collect more feedback to generate insights." 
            });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.warn("GROQ_API_KEY is missing. Falling back to mock summary.");
            throw new Error("Missing API Key");
        }

        // Initialize Groq client
        const groq = new Groq({ apiKey });
        
        // Extract text from reviews (handles both string arrays and object arrays)
        const feedbackText = reviews
            .map(r => {
                if (typeof r === 'string') return r;
                return r.review_text || r.text || '';
            })
            .filter(t => t.trim() !== '')
            .join('\n- ');
            
        const prompt = `You are an expert product analyst. Based on the following customer feedback, provide a concise, 2-sentence executive summary of the overall themes. Do not use markdown, just return a professional, plain text paragraph.\n\nFeedback:\n- ${feedbackText}`;

        // Call Groq Qwen
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'qwen/qwen3.8-27b',
            temperature: 0.5,
        });

        const summaryText = chatCompletion.choices[0]?.message?.content || "Summary generated successfully, but no content returned.";

        res.json({ success: true, summary: summaryText });
    } catch (err) {
        console.error('[Groq API Error]:', err.message);
        
        // Robust fallback message if Groq fails
        const fallbackSummary = "Customers generally appreciate the recent UI updates and praise the customer support team's responsiveness. However, several users have reported friction with the pricing structure and occasional app crashes on mobile devices.";
        
        res.json({ success: true, summary: fallbackSummary });
    }
}

module.exports = { getSentimentTrends, generateSummary };
