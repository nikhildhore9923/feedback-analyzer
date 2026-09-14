const db = require('./connection');

async function migrate() {
    try {
        console.log("Running migrations...");
        
        // Add tenant_id to batches
        try {
            await db.query("ALTER TABLE batches ADD COLUMN tenant_id VARCHAR(255) DEFAULT 'default'");
            console.log("Added tenant_id to batches.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
        }
        
        // Drop unique label constraint on batches
        try {
            await db.query("ALTER TABLE batches DROP INDEX label");
            console.log("Dropped unique label on batches.");
        } catch (e) {
            if (e.code !== 'ER_CANT_DROP_FIELD_OR_KEY') console.error(e.message);
        }

        // Add composite unique constraint
        try {
            await db.query("ALTER TABLE batches ADD UNIQUE (label, tenant_id)");
            console.log("Added composite unique constraint to batches.");
        } catch (e) {
            if (e.code !== 'ER_DUP_KEYNAME') console.error(e.message);
        }

        // Add tenant_id to reviews
        try {
            await db.query("ALTER TABLE reviews ADD COLUMN tenant_id VARCHAR(255) DEFAULT 'default'");
            console.log("Added tenant_id to reviews.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
        }
        
        // Add tenant_id to settings
        try {
            await db.query("ALTER TABLE settings ADD COLUMN tenant_id VARCHAR(255) DEFAULT 'default'");
            console.log("Added tenant_id to settings.");
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message);
        }

        // Drop unique primary key on settings
        try {
            await db.query("ALTER TABLE settings DROP PRIMARY KEY, ADD PRIMARY KEY (setting_key, tenant_id)");
            console.log("Updated settings primary key.");
        } catch (e) {
            if (e.code !== 'ER_MULTIPLE_PRI_KEY') console.error(e.message);
        }

        console.log("Migrations complete.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
