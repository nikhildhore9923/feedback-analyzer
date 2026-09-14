const nodemailer = require('nodemailer');
const db = require('../db/connection');
require('dotenv').config();

async function getEmailConfig(tenantId = 'default') {
    const [rows] = await db.query(`SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('email_user', 'email_pass', 'alert_to') AND tenant_id = ?`, [tenantId]);
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
async function sendAlertEmail(reviewText, sentiment, confidence, severity, aspect, tenantId = 'default') {
    const config = await getEmailConfig(tenantId);

    // Use the Resend API Key from environment variables (set this in Render Dashboard)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const recipient = config.to || config.user;

    if (!recipient) {
        console.log('[mailer] Skipped alert (no recipient email configured in Settings).');
        return false;
    }

    try {
        const axios = require('axios');
        const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">⚡ Pulse</h1>
                    <p style="color: #e0e7ff; margin: 8px 0 0 0; font-size: 14px;">Customer Intelligence Platform</p>
                </div>
                <div style="padding: 32px;">
                    <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Critical Feedback Detected</h2>
                    <p style="color: #475569; font-size: 15px; line-height: 1.6;">A new customer review has been flagged by the Pulse Intelligence system and requires your attention.</p>
                    <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #ef4444; margin: 24px 0; border-radius: 0 8px 8px 0;">
                        <p style="margin: 0; font-style: italic; color: #1e293b; font-size: 16px; line-height: 1.5;">"${reviewText}"</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                        <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Sentiment</td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #ef4444; font-weight: 600; text-align: right;">${sentiment}</td></tr>
                        <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Confidence</td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; text-align: right;">${(confidence * 100).toFixed(1)}%</td></tr>
                        <tr><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">Category</td><td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 600; text-align: right;">${aspect}</td></tr>
                    </table>
                    <div style="text-align: center;">
                        <a href="https://pulse-feedback-analyzer.vercel.app/" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">View Dashboard</a>
                    </div>
                </div>
            </div>
        `;

        const response = await axios.post('https://api.resend.com/emails', {
            from: 'Pulse System <onboarding@resend.dev>',
            to: recipient,
            subject: `Pulse Notification: New feedback flagged (${aspect})`,
            html: htmlContent
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`
            }
        });

        console.log('[mailer] Resend API alert sent successfully.');
        return true;
    } catch (err) {
        console.error('[mailer] Failed to send alert:', err.response?.data || err.message);
        return false;
    }
}

module.exports = { sendAlertEmail };
