const axios = require('axios');
require('dotenv').config();

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5001/predict';

async function analyzeFeedback(text) {
    try {
        const response = await axios.post(PYTHON_SERVICE_URL, { text });
        // Expected response: { sentiment, confidence, severity, aspect }
        return response.data;
    } catch (err) {
        console.error('[ML Service] Error calling ML service:', err.message);
        throw new Error('Could not reach ML service');
    }
}

module.exports = { analyzeFeedback };
