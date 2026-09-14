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

    // Use the Resend API Key from environment variables (set this in Render Dashboard)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const recipient = config.to || config.user;

    if (!recipient) {
        console.log('[mailer] Skipped alert (no recipient email configured in Settings).');
        return false;
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: 'Pulse System <onboarding@resend.dev>',
                to: recipient,
                subject: `Pulse Notification: New feedback flagged (${aspect})`,
                text: `Hello,\n\nA new customer review has been flagged by the Pulse Feedback Intelligence system.\n\nReview details:\n- Text: "${reviewText}"\n- Detected Sentiment: ${sentiment}\n- Model Confidence: ${(confidence * 100).toFixed(1)}%\n- Severity Score: ${severity.toFixed(2)}\n- Category: ${aspect}\n\nYou can view and manage this feedback in your Pulse Dashboard.\n\nBest regards,\nPulse System`
            })
        });

        if (response.ok) {
            console.log('[mailer] Resend API alert sent successfully.');
            return true;
        } else {
            const errorData = await response.json();
            console.error('[mailer] Resend API failed:', errorData);
            return false;
        }
    } catch (err) {
        console.error('[mailer] Failed to send alert:', err.message);
        return false;
    }
}

module.exports = { sendAlertEmail };
