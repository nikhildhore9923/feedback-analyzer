const db = require('../db/connection');
const feedbackService = require('../services/feedbackService');

async function getSettings(req, res, next) {
    try {
        const [rows] = await db.query(`SELECT setting_key, setting_value FROM settings`);
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

        if (alertThreshold !== undefined) {
            queries.push(`INSERT INTO settings (setting_key, setting_value) VALUES ('alert_threshold', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`);
            params.push([String(alertThreshold)]);
        }
        if (emailUser !== undefined) {
            queries.push(`INSERT INTO settings (setting_key, setting_value) VALUES ('email_user', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`);
            params.push([emailUser]);
        }
        if (emailPass !== undefined && emailPass !== '********') {
            queries.push(`INSERT INTO settings (setting_key, setting_value) VALUES ('email_pass', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`);
            params.push([emailPass]);
        }
        if (alertTo !== undefined) {
            queries.push(`INSERT INTO settings (setting_key, setting_value) VALUES ('alert_to', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`);
            params.push([alertTo]);
        }

        for (let i = 0; i < queries.length; i++) {
            await db.query(queries[i], params[i]);
        }

        res.json({ message: "Settings updated successfully" });
    } catch (err) {
        next(err);
    }
}

module.exports = { getSettings, updateSettings };
