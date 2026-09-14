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

const tenantMiddleware = require('./src/middleware/tenant');
app.use('/api', tenantMiddleware, apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Node API is running' });
});

const initDB = require('./src/db/init');

// Centralized error handling middleware
app.use(errorHandler);

// Initialize DB and start server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Node server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to start server due to DB initialization failure:", err);
});