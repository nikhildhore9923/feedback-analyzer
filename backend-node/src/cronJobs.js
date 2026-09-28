const cron = require('node-cron');
const db = require('./db/connection');
const { sendTrendAlertEmail } = require('./utils/mailer');

/**
 * Automates daily sentiment trend evaluation for all active workspaces.
 */
function initializeCronJobs() {
    // Schedule: Runs every day at 08:00 AM server time
    // Cron syntax: '0 8 * * *' (Minute: 0, Hour: 8)
async function runDailyEvaluation() {
    console.log('[Cron] Starting daily trend evaluation task...');

    try {
        const [recentReviews] = await db.query(`
            SELECT tenant_id, priority_score 
            FROM reviews 
            WHERE timestamp >= NOW() - INTERVAL 1 DAY
        `);

        if (recentReviews.length === 0) {
            console.log('[Cron] No feedback received in the last 24 hours. Skipping.');
            return;
        }

        const tenantGroups = {};
        recentReviews.forEach(review => {
            if (!tenantGroups[review.tenant_id]) tenantGroups[review.tenant_id] = [];
            tenantGroups[review.tenant_id].push(review);
        });

        for (const [tenantId, reviews] of Object.entries(tenantGroups)) {
            const totalScore = reviews.reduce((sum, r) => sum + r.priority_score, 0);
            const averageScore = totalScore / reviews.length;
            const THRESHOLD = 75;
            
            if (averageScore < THRESHOLD) {
                console.log(`[Cron] Alert Triggered for tenant '${tenantId}': Avg ${averageScore.toFixed(1)} < ${THRESHOLD}`);
                await sendTrendAlertEmail(averageScore, THRESHOLD, tenantId)
                    .catch(err => console.error(`[Cron] Email failed for ${tenantId}:`, err));
            } else {
                console.log(`[Cron] Tenant '${tenantId}' is healthy (Avg: ${averageScore.toFixed(1)}).`);
            }
        }
    } catch (error) {
        console.error('[Cron] Error running daily trend evaluation:', error);
        throw error;
    }
}

function initializeCronJobs() {
    cron.schedule('0 8 * * *', runDailyEvaluation);
    console.log('[Cron] Daily trend evaluation task scheduled for 8:00 AM.');
}

module.exports = { initializeCronJobs, runDailyEvaluation };
