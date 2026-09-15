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
        
        // --- MIGRATIONS (Safe to run repeatedly) ---
        const migrations = [
            "ALTER TABLE batches ADD COLUMN tenant_id VARCHAR(255) DEFAULT 'default'",
            "ALTER TABLE batches DROP INDEX label",
            "ALTER TABLE batches ADD UNIQUE (label, tenant_id)",
            "ALTER TABLE reviews ADD COLUMN tenant_id VARCHAR(255) DEFAULT 'default'",
            "ALTER TABLE settings ADD COLUMN tenant_id VARCHAR(255) DEFAULT 'default'",
            "ALTER TABLE settings DROP PRIMARY KEY, ADD PRIMARY KEY (setting_key, tenant_id)",
            "UPDATE reviews SET priority_score = CASE WHEN sentiment = 'Negative' THEN ROUND(50 + (confidence * 50)) WHEN sentiment = 'Neutral' THEN ROUND(50 - (confidence * 20)) ELSE ROUND(30 - (confidence * 20)) END WHERE priority_score = 0"
        ];

        for (let sql of migrations) {
            try {
                await connection.query(sql);
            } catch (e) {
                // Ignore "Duplicate column name" and "Duplicate key name"
                if (!['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_CANT_DROP_FIELD_OR_KEY', 'ER_MULTIPLE_PRI_KEY'].includes(e.code)) {
                    console.log(`[DB] Migration skipped/failed for "${sql}":`, e.message);
                }
            }
        }

        // Now that the table definitely has tenant_id, we can safely insert the default
        await connection.query("INSERT IGNORE INTO settings (setting_key, tenant_id, setting_value) VALUES ('alert_threshold', 'default', '-0.5')");

        console.log('[DB] Database tables and migrations verified successfully.');
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
