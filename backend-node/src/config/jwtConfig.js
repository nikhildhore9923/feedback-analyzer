require('dotenv').config();

/**
 * Validates and retrieves the JWT Secret securely.
 * In production / Vercel environments, a missing JWT_SECRET throws an error immediately
 * to prevent insecure fallback vulnerabilities.
 */
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    
    if (!secret || secret.trim() === '') {
        const isProduction = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
        if (isProduction) {
            console.error('[CRITICAL SECURITY ERROR] JWT_SECRET environment variable is missing in production!');
            throw new Error('Server configuration error: JWT_SECRET environment variable is required.');
        }
        
        // Development-only fallback warning
        console.warn('[SECURITY WARNING] JWT_SECRET is not set in your .env file. Using a development-only key.');
        return 'pulse_dev_local_secret_change_in_production_2026';
    }
    
    return secret;
}

module.exports = { getJwtSecret };
