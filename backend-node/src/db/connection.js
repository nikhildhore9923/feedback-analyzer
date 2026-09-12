const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pulse_db',
    ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud') ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00', // Ensure UTC timestamps
});

// Test connection on startup
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('[DB] Connected to MySQL successfully (UTC timezone).');
        connection.release();
    } catch (error) {
        console.error('[DB] Database connection failed:', error.message);
        // Do not exit process entirely, let it degrade gracefully
    }
})();

module.exports = pool;
