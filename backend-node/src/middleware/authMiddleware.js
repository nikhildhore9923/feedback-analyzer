const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'pulse_super_secret_key_2026';

function authMiddleware(req, res, next) {
    // 1. Skip auth for login and signup routes (if mounted under same router)
    if (req.path === '/login' || req.path === '/signup') {
        return next();
    }

    const authHeader = req.headers['authorization'];
    
    // 2. Strict JWT Verification
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Attach tenantId directly to the request for all downstream queries
            req.tenantId = decoded.tenantId; 
            req.user = decoded;
            
            return next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
    }

    // 3. Deny access if no valid token
    return res.status(401).json({ success: false, message: 'Authentication required' });
}

module.exports = authMiddleware;
