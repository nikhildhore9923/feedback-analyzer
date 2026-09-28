const axios = require('axios');
require('dotenv').config();

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001/predict';

async function analyzeFeedback(text) {
    try {
        // Timeout added so it doesn't hang forever if Render is sleeping
        const response = await axios.post(PYTHON_SERVICE_URL, { text }, { timeout: 3500 });
        return response.data;
    } catch (err) {
        console.warn(`[ML Service] Python ML unreachable (${err.message}). Falling back to Mock ML for Resume Demo.`);
        
        // --- Mock ML Fallback Logic ---
        const lowerText = text.toLowerCase();
        let sentiment = 'Neutral';
        let confidence = 0.50 + (Math.random() * 0.3); // 0.50 to 0.80
        let severity = 0;
        let aspect = 'General';
        
        // Simple keyword-based sentiment rules
        if (lowerText.match(/(good|great|amazing|love|awesome|fast|best)/)) {
            sentiment = 'Positive';
            confidence = 0.75 + (Math.random() * 0.2); // 0.75 to 0.95
        } else if (lowerText.match(/(bad|terrible|crash|hate|slow|bug|worst|expensive|broken)/)) {
            sentiment = 'Negative';
            confidence = 0.80 + (Math.random() * 0.15); // 0.80 to 0.95
            severity = lowerText.includes('crash') ? 0.9 : (lowerText.includes('bug') ? 0.7 : 0.4);
        }

        // Simple keyword-based aspect rules
        if (lowerText.match(/(ui|design|button|interface|look)/)) aspect = 'UI/UX';
        else if (lowerText.match(/(price|cost|expensive|cheap|money)/)) aspect = 'Pricing';
        else if (lowerText.match(/(support|help|service|email|call)/)) aspect = 'Customer Service';
        else if (lowerText.match(/(fast|slow|crash|bug|loading)/)) aspect = 'Performance';

        // Simulate network latency (800ms)
        await new Promise(resolve => setTimeout(resolve, 800));

        return { sentiment, confidence, severity, aspect };
    }
}

module.exports = { analyzeFeedback };
