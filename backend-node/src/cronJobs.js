const cron = require('node-cron');
const db = require('./db/connection');
const { sendTrendAlertEmail } = require('./utils/mailer');

/**
 * Automates daily sentiment trend evaluation for all active workspaces.
 */
function initializeCronJobs() {
    // Schedule: Runs every day at 08:00 AM server time
    // Cron syntax: '0 8 * * *' (Minute: 0, Hour: 8)
    cron.schedule('0 8 * * *', async () => {
        console.log('[Cron] Starting daily 8:00 AM trend evaluation task...');

        try {
            // 1. Query DB for feedback in the last 24 hours
            const [recentReviews] = await db.query(`
                SELECT tenant_id, priority_score 
                FROM reviews 
                WHERE timestamp >= NOW() - INTERVAL 1 DAY
            `);

            if (recentReviews.length === 0) {
                console.log('[Cron] No feedback received in the last 24 hours. Skipping.');
                return;
            }

            // Group reviews by workspace (tenant) to respect isolation
            const tenantGroups = {};
            recentReviews.forEach(review => {
                if (!tenantGroups[review.tenant_id]) tenantGroups[review.tenant_id] = [];
                tenantGroups[review.tenant_id].push(review);
            });

            // 2. Evaluate each workspace independently
            for (const [tenantId, reviews] of Object.entries(tenantGroups)) {
                
                // Calculate the average score for this specific workspace
                const totalScore = reviews.reduce((sum, r) => sum + r.priority_score, 0);
                const averageScore = totalScore / reviews.length;

                // 3. Check if the average falls below a threshold (e.g., drops below 75)
                // In Pulse, priority_score is 0-100 (where 80+ is critical). If we consider "satisfaction",
                // we'll invert it, or just use 75 as a generic score threshold drop. Let's assume average drops below 75 means an issue for this specific requirement.
                const THRESHOLD = 75;
                const isBelowThreshold = averageScore < THRESHOLD;

                // 4. Trigger the email if the condition is met
                if (isBelowThreshold) {
                    console.log(`[Cron] Alert Triggered for tenant '${tenantId}': Avg ${averageScore.toFixed(1)} < ${THRESHOLD}`);
                    
                    // Fire-and-forget email dispatch
                    sendTrendAlertEmail(averageScore, THRESHOLD, tenantId)
                        .catch(err => console.error(`[Cron] Email failed for ${tenantId}:`, err));
                } else {
                    console.log(`[Cron] Tenant '${tenantId}' is healthy (Avg: ${averageScore.toFixed(1)}).`);
                }
            }

        } catch (error) {
            console.error('[Cron] Error running daily trend evaluation:', error);
        }
    });

    console.log('[Cron] Daily trend evaluation task scheduled for 8:00 AM.');
}

module.exports = initializeCronJobs;
