const jwt = require('jsonwebtoken');
const User = require('../models/user');
const mongoose = require('mongoose');

// Secret key fallback for effortless startup
const JWT_SECRET = process.env.JWT_SECRET || 'mockmate_super_secret_fallback_key';

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token signature
            const decoded = jwt.verify(token, JWT_SECRET);

            // Fetch the user from the database (if MongoDB is connected)
            if (mongoose.connection.readyState === 1) {
                req.user = await User.findById(decoded.id).select('-password');
                
                if (!req.user) {
                    return res.status(401).json({ error: "User associated with this token no longer exists." });
                }
            } else {
                // If operating in in-memory fallback, construct a simulated user session
                req.user = {
                    _id: decoded.id,
                    name: decoded.name || 'Mock Candidate',
                    email: decoded.email || 'mock@example.com'
                };
            }

            return next();
        } catch (error) {
            console.error("Token verification failed:", error.message);
            return res.status(401).json({ error: "Not authorized: token is invalid or expired." });
        }
    }

    if (!token) {
        return res.status(401).json({ error: "Not authorized: no session token provided in headers." });
    }
};

module.exports = { protect };
