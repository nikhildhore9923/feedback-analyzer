const db = require('../db/connection');
const feedbackService = require('../services/feedbackService');

async function getSettings(req, res, next) {
    try {
        const [rows] = await db.query(`SELECT setting_key, setting_value FROM settings WHERE tenant_id = ?`, [req.tenantId]);
        const settings = {
            alertThreshold: -0.5,
            emailUser: '',
            emailPass: '',
            alertTo: ''
        };
        
        rows.forEach(r => {
            if (r.setting_key === 'alert_threshold') settings.alertThreshold = parseFloat(r.setting_value);
            if (r.setting_key === 'email_user') settings.emailUser = r.setting_value;
            if (r.setting_key === 'email_pass') settings.emailPass = r.setting_value ? '********' : '';
            if (r.setting_key === 'alert_to') settings.alertTo = r.setting_value;
        });

        res.json(settings);
    } catch (err) {
        next(err);
    }
}

async function updateSettings(req, res, next) {
    try {
        const { alertThreshold, emailUser, emailPass, alertTo } = req.body;
        
        const queries = [];
        const params = [];
        const tid = req.tenantId;

        if (alertThreshold !== undefined) {
            queries.push(`INSERT INTO settings (setting_key, tenant_id, setting_value) VALUES ('alert_threshold', ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`);
            params.push([tid, String(alertThreshold)]);
        }
        if (emailUser !== undefined) {
            queries.push(`INSERT INTO settings (setting_key, tenant_id, setting_value) VALUES ('email_user', ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`);
            params.push([tid, emailUser]);
        }
        if (emailPass !== undefined && emailPass !== '********') {
            queries.push(`INSERT INTO settings (setting_key, tenant_id, setting_value) VALUES ('email_pass', ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`);
            params.push([tid, emailPass]);
        }
        if (alertTo !== undefined) {
            queries.push(`INSERT INTO settings (setting_key, tenant_id, setting_value) VALUES ('alert_to', ?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`);
            params.push([tid, alertTo]);
        }

        for (let i = 0; i < queries.length; i++) {
            await db.query(queries[i], params[i]);
        }

        res.json({ message: "Settings updated successfully" });
    } catch (err) {
        next(err);
    }
}

async function clearTenantData(req, res, next) {
    try {
        const tid = req.tenantId;
        // Due to foreign keys, delete reviews first, then batches
        await db.query(`DELETE FROM reviews WHERE tenant_id = ?`, [tid]);
        await db.query(`DELETE FROM batches WHERE tenant_id = ?`, [tid]);
        res.json({ message: "Workspace reset successful" });
    } catch (err) {
        next(err);
    }
}

module.exports = { getSettings, updateSettings, clearTenantData };
