const User = require('../models/user');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Fallback user store when MongoDB is disconnected
const inMemoryUsers = new Map();

// Simulated reset code store
const simulatedResetCodes = new Map();

const JWT_SECRET = process.env.JWT_SECRET || 'mockmate_super_secret_fallback_key';

/**
 * Helper to check if MongoDB is active and connected
 */
const isDbConnected = () => {
    return mongoose.connection.readyState === 1;
};

/**
 * Helper to generate JWT Token
 */
const generateToken = (id, name, email) => {
    return jwt.sign({ id, name, email }, JWT_SECRET, {
        expiresIn: '30d'
    });
};

/**
 * 1. Register a new user
 */
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required." });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long." });
        }

        let existingUser;
        const normalizedEmail = email.toLowerCase().trim();

        if (isDbConnected()) {
            existingUser = await User.findOne({ email: normalizedEmail });
        } else {
            existingUser = inMemoryUsers.get(normalizedEmail);
        }

        if (existingUser) {
            return res.status(400).json({ error: "An account with this email address already exists." });
        }

        let userSession;

        if (isDbConnected()) {
            const newUser = new User({ name, email: normalizedEmail, password });
            await newUser.save();
            userSession = {
                id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email
            };
        } else {
            // Simulated local user for offline dev
            const mockId = 'usr_' + Math.random().toString(36).substring(2, 11);
            // Hash password manually for in-memory security representation
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const mockUserObj = {
                _id: mockId,
                name,
                email: normalizedEmail,
                password: hashedPassword,
                createdAt: new Date()
            };

            inMemoryUsers.set(normalizedEmail, mockUserObj);
            userSession = {
                id: mockId,
                name,
                email: normalizedEmail
            };
            console.log(`[MockAuth] User registered offline: ${normalizedEmail}`);
        }

        const token = generateToken(userSession.id, userSession.name, userSession.email);

        return res.status(201).json({
            message: "Registration completed successfully",
            token,
            user: userSession
        });

    } catch (error) {
        console.error("Error in register controller:", error.message);
        return res.status(500).json({ error: "Failed to register candidate account." });
    }
};

/**
 * 2. Log in an existing user
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please enter your email and password." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user;

        if (isDbConnected()) {
            user = await User.findOne({ email: normalizedEmail });
            if (user) {
                const isMatch = await user.comparePassword(password);
                if (!isMatch) {
                    return res.status(401).json({ error: "Incorrect password." });
                }
            }
        } else {
            user = inMemoryUsers.get(normalizedEmail);
            if (user) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({ error: "Incorrect password." });
                }
            }
        }

        if (!user) {
            return res.status(404).json({ error: "No account found with this email address." });
        }

        const userIdStr = user._id.toString();
        const token = generateToken(userIdStr, user.name, user.email);

        return res.status(200).json({
            message: "Logged in successfully",
            token,
            user: {
                id: userIdStr,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Error in login controller:", error.message);
        return res.status(500).json({ error: "Failed to log in user." });
    }
};

/**
 * 3. Request simulated password reset code
 */
const requestReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let userExists;

        if (isDbConnected()) {
            userExists = await User.findOne({ email: normalizedEmail });
        } else {
            userExists = inMemoryUsers.has(normalizedEmail);
        }

        if (!userExists) {
            return res.status(404).json({ error: "No account registered under this email." });
        }

        // Generate a simple static reset code for effortless developer testing
        const code = "MOCK123";
        simulatedResetCodes.set(normalizedEmail, code);

        return res.status(200).json({
            message: "Simulated reset token generated successfully.",
            instruction: "For convenience in testing, use the code below to reset your password.",
            resetCode: code
        });
    } catch (error) {
        console.error("Error in requestReset:", error.message);
        return res.status(500).json({ error: "Failed to initiate password reset." });
    }
};

/**
 * 4. Perform password reset
 */
const resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: "All fields and verification code are required." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const savedCode = simulatedResetCodes.get(normalizedEmail);

        if (!savedCode || savedCode !== code) {
            return res.status(400).json({ error: "Invalid or expired verification code." });
        }

        if (isDbConnected()) {
            const user = await User.findOne({ email: normalizedEmail });
            if (!user) {
                return res.status(404).json({ error: "Account not found." });
            }
            user.password = newPassword; // Will trigger mongoose pre-save hash hook
            await user.save();
        } else {
            const user = inMemoryUsers.get(normalizedEmail);
            if (!user) {
                return res.status(404).json({ error: "Account not found." });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            user.password = hashedPassword;
            inMemoryUsers.set(normalizedEmail, user);
        }

        // Clean up reset code
        simulatedResetCodes.delete(normalizedEmail);

        return res.status(200).json({
            message: "Password reset completed successfully. You can now log in with your new credentials!"
        });
    } catch (error) {
        console.error("Error in resetPassword:", error.message);
        return res.status(500).json({ error: "Failed to reset password." });
    }
};

module.exports = {
    register,
    login,
    requestReset,
    resetPassword
};
