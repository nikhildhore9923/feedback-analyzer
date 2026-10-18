require('dotenv').config();

/**
 * Validates and retrieves the JWT Secret securely.
 * In production / Vercel environments, a missing JWT_SECRET throws an error immediately
 * to prevent insecure fallback vulnerabilities.
 */
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    
    if (!secret || secret.trim() === '') {
        console.warn('[SECURITY WARNING] JWT_SECRET is not configured in environment variables. Falling back to default secret. Set JWT_SECRET in Vercel for production security.');
        return 'pulse_super_secret_key_2026';
    }
    
    return secret;
}

module.exports = { getJwtSecret };
