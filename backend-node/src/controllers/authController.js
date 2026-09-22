const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');

const JWT_SECRET = process.env.JWT_SECRET || 'pulse_super_secret_key_2026';

// SIGNUP ROUTE
async function signup(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        // 1. Check if user already exists
        const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        // 2. Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Generate unique tenant_id
        const tenantId = uuidv4();

        // 4. Save user to database
        const [result] = await db.query(
            'INSERT INTO users (email, password_hash, tenant_id) VALUES (?, ?, ?)',
            [email, passwordHash, tenantId]
        );

        const userId = result.insertId;

        // 5. Generate JWT Token
        const payload = { userId, email, tenantId };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: { id: userId, email, tenant_id: tenantId }
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

// LOGIN ROUTE
async function login(req, res) {
    const { email, password } = req.body;

    try {
        // 1. Find user by email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];

        // 2. Verify password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // 3. Generate JWT Token
        const payload = {
            userId: user.id,
            email: user.email,
            tenantId: user.tenant_id
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        return res.json({
            success: true,
            message: 'Authentication successful',
            token,
            user: { id: user.id, email: user.email, tenant_id: user.tenant_id }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

module.exports = {
    signup,
    login
};
