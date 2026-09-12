require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes/index');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*' // In production, restrict to frontend domain
}));
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Node API is running' });
});

// Centralized error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Node server running on port ${PORT}`);
});