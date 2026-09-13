const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    console.log('[DB] Initializing database...');
    try {
        // Connect with the configured database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'pulse_db',
            ssl: process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud') ? { rejectUnauthorized: false } : undefined,
            multipleStatements: true
        });

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        await connection.query(schema);
        console.log('[DB] Database and tables created successfully.');
        await connection.end();
    } catch (err) {
        console.error('[DB] Failed to initialize database:', err.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    initDB();
}

module.exports = initDB;
