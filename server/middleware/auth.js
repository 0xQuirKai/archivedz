import jwt from 'jsonwebtoken';
import { dbGet } from '../config/database.js';

export const authenticateToken = async(req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Access denied',
            message: 'No token provided'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user still exists
        const user = await dbGet('SELECT id, email, name FROM users WHERE id = ?', [decoded.userId]);
        if (!user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Invalid token - user not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(403).json({
            error: 'Access denied',
            message: 'Invalid or expired token'
        });
    }
};

export const optionalAuth = async(req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await dbGet('SELECT id, email, name FROM users WHERE id = ?', [decoded.userId]);
        req.user = user || null;
    } catch (error) {
        req.user = null;
    }

    next();
};