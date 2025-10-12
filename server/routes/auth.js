import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbRun, dbGet, dbAll } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Helper function to validate license code
const validateLicenseCode = async(licenseCode) => {
    try {
        const licenseFilePath = path.join(__dirname, '..', 'license-codes.json');
        const licenseData = JSON.parse(fs.readFileSync(licenseFilePath, 'utf8'));

        if (!licenseData.licenseCodes[licenseCode]) {
            return { valid: false, message: 'Invalid license code' };
        }

        const license = licenseData.licenseCodes[licenseCode];

        // Check if license has reached max uses
        if (license.currentUses >= license.maxUses) {
            return { valid: false, message: 'License code has reached maximum usage limit' };
        }

        return { valid: true, license };
    } catch (error) {
        console.error('License validation error:', error);
        return { valid: false, message: 'License validation failed' };
    }
};

// Helper function to increment license usage
const incrementLicenseUsage = async(licenseCode, userId) => {
    try {
        const licenseFilePath = path.join(__dirname, '..', 'license-codes.json');
        const licenseData = JSON.parse(fs.readFileSync(licenseFilePath, 'utf8'));

        if (licenseData.licenseCodes[licenseCode]) {
            licenseData.licenseCodes[licenseCode].currentUses += 1;
            fs.writeFileSync(licenseFilePath, JSON.stringify(licenseData, null, 2));

            // Record usage in database
            await dbRun(
                'INSERT INTO license_usage (id, license_code, user_id) VALUES (?, ?, ?)', [uuidv4(), licenseCode, userId]
            );
        }
    } catch (error) {
        console.error('License usage increment error:', error);
    }
};

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId },
        process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// Register endpoint
router.post('/register', async(req, res) => {
    try {
        const { name, email, password, licenseCode } = req.body;

        // Validation
        if (!name || !email || !password || !licenseCode) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Name, email, password, and license code are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Invalid password',
                message: 'Password must be at least 6 characters long'
            });
        }

        // Validate license code
        const licenseValidation = await validateLicenseCode(licenseCode);
        if (!licenseValidation.valid) {
            return res.status(400).json({
                error: 'Invalid license code',
                message: licenseValidation.message
            });
        }

        // Check if user already exists
        const existingUser = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'An account with this email already exists'
            });
        }

        // Check if license code has already been used by this email
        const existingLicenseUsage = await dbGet(
            'SELECT id FROM license_usage WHERE license_code = ? AND user_id IN (SELECT id FROM users WHERE email = ?)', [licenseCode, email]
        );
        if (existingLicenseUsage) {
            return res.status(400).json({
                error: 'License code already used',
                message: 'This license code has already been used by this email address'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const userId = uuidv4();
        await dbRun(
            'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)', [userId, name, email, hashedPassword]
        );

        // Increment license usage
        await incrementLicenseUsage(licenseCode, userId);

        // Generate token
        const token = generateToken(userId);

        res.status(201).json({
            id: userId,
            name,
            email,
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: 'An error occurred during registration'
        });
    }
});

// Login endpoint
router.post('/login', async(req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing credentials',
                message: 'Email and password are required'
            });
        }

        // Find user
        const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: 'An error occurred during login'
        });
    }
});

// Get current user endpoint
router.get('/me', authenticateToken, async(req, res) => {
    try {
        res.json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            error: 'Failed to get user information',
            message: 'An error occurred while fetching user data'
        });
    }
});

// Logout endpoint (optional - token invalidation would require a token blacklist)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        message: 'Logged out successfully'
    });
});

export default router;