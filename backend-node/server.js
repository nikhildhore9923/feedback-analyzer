require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes/index');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*', // In production, restrict to frontend domain
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
}));
app.use(express.json());

const authMiddleware = require('./src/middleware/authMiddleware');
app.use('/api', authMiddleware, apiRoutes);

// Health check endpoint
const db = require('./src/db/connection');
app.get('/health', async (req, res) => {
    try {
        // Ping the database to keep the Aiven free-tier connection alive
        await db.query('SELECT 1');
        res.json({ status: 'Node API is running', database: 'connected' });
    } catch (err) {
        console.error('Health check DB error:', err.message);
        res.status(500).json({ status: 'Node API is running', database: 'disconnected', error: err.message });
    }
});

const initDB = require('./src/db/init');
const { initializeCronJobs } = require('./src/cronJobs');

// Centralized error handling middleware
app.use(errorHandler);

// Initialize DB and start server (only if NOT running in Vercel)
if (!process.env.VERCEL) {
    initDB().then(() => {
        // Initialize local node-cron scheduled tasks (Vercel will use the /api/cron endpoint instead)
        initializeCronJobs();

        app.listen(PORT, () => {
            console.log(`Node server running on port ${PORT}`);
        });
    }).catch(err => {
        console.error("Failed to start server due to DB initialization failure:", err);
    });
} else {
    // For Vercel Serverless, initialize DB asynchronously on cold start
    initDB().catch(console.error);
}

// Export the Express API for Vercel serverless
module.exports = app;