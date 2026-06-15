const jwt = require('jsonwebtoken');
const User = require('../models/user');
const mongoose = require('mongoose');

// Secret key fallback for effortless startup
const JWT_SECRET = process.env.JWT_SECRET || 'mockmate_super_secret_fallback_key';

const protect = async (req, res, next) => {
    // Prototype Bypass: Automatically inject a static mock user session for the prototype
    req.user = {
        _id: new mongoose.Types.ObjectId("60c72b2f9b1d8b2d88a1b5d6"),
        name: 'Prototype Candidate',
        email: 'prototype@example.com'
    };
    return next();
};

module.exports = { protect };
