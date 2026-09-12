const nodemailer = require('nodemailer');
const db = require('../db/connection');
require('dotenv').config();

async function getEmailConfig() {
    const [rows] = await db.query(`SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('email_user', 'email_pass', 'alert_to')`);
    const config = {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
        to: process.env.ALERT_TO || process.env.EMAIL_USER
    };

    rows.forEach(r => {
        if (r.setting_key === 'email_user' && r.setting_value) config.user = r.setting_value;
        if (r.setting_key === 'email_pass' && r.setting_value) config.pass = r.setting_value;
        if (r.setting_key === 'alert_to' && r.setting_value) config.to = r.setting_value;
    });

    return config;
}

/**
 * Send an alert email when critical feedback is received.
 */
async function sendAlertEmail(reviewText, sentiment, confidence, severity, aspect) {
    const config = await getEmailConfig();

    if (!config.user || !config.pass) {
        console.log('[mailer] Skipped alert (email not configured in Settings or .env):', reviewText);
        return false;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.user,
            pass: config.pass,
        },
    });

    try {
        await transporter.sendMail({
            from: config.user,
            to: config.to || config.user,
            subject: `Pulse Notification: New feedback flagged (${aspect})`,
            text: `Hello,

A new customer review has been flagged by the Pulse Feedback Intelligence system.

Review details:
- Text: "${reviewText}"
- Detected Sentiment: ${sentiment}
- Model Confidence: ${(confidence * 100).toFixed(1)}%
- Severity Score: ${severity.toFixed(2)}
- Category: ${aspect}

You can view and manage this feedback in your Pulse Dashboard.

Best regards,
Pulse System`,
        });
        console.log('[mailer] Alert email sent.');
        return true;
    } catch (err) {
        console.error('[mailer] Failed to send alert:', err.message);
        return false;
    }
}

module.exports = { sendAlertEmail };
