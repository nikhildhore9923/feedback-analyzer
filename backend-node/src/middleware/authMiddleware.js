const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwtConfig');

function authMiddleware(req, res, next) {
    // 1. Skip auth for login, signup, and cron routes
    if (req.path === '/login' || req.path === '/signup' || req.path === '/cron/daily-alerts') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    
    // 2. Strict JWT Verification
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const secret = getJwtSecret();
            const decoded = jwt.verify(token, secret);
            
            // Attach tenantId directly to the request for all downstream queries
            req.tenantId = decoded.tenantId; 
            req.user = decoded;
            
            return next();
        } catch (error) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired token. Please log in again.',
                error: 'Invalid or expired token. Please log in again.' 
            });
        }
    }

    // 3. Deny access if no valid token
    return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. No bearer token provided.',
        error: 'Authentication required. No bearer token provided.' 
    });
}

module.exports = authMiddleware;
