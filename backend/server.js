const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config();

const app = express();

// Set up middleware
app.use(cors());
app.use(express.json());

// Database connection helper
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not specified in environment variables.");
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected successfully: ${conn.connection.host} 🚀`);
    } catch (error) {
        console.warn("⚠️  MongoDB connection failed: ", error.message);
        console.warn("⚠️  MockMate is operating in In-Memory fallback storage mode.");
    }
};

connectDB();

// API Endpoints
const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);

app.get("/api/status", (req, res) => {
    res.status(200).json({ 
        message: "AI Interviewer Engine is online",
        dbConnected: mongoose.connection.readyState === 1,
        geminiActive: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE')
    });
});

// Serve frontend static assets in production
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback index.html router for SPA
app.get(/.*/, (req, res, next) => {
    // Only serve index.html if request is not an API call
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
        if (err) {
            // If the build does not exist, send a friendly developer helper message
            res.status(200).send(`
                <div style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f0c1b; color: #fff; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <h1 style="color: #8b5cf6;">MockMate AI Interviewer Server is Running!</h1>
                    <p style="color: #94a3b8; font-size: 1.1rem; max-width: 600px;">
                        The backend API server is fully operational. To view the premium UI, please start the frontend development server by navigating to the <code>/frontend</code> directory and running:
                    </p>
                    <pre style="background: #1e1b4b; padding: 16px; border-radius: 8px; color: #a5b4fc; font-size: 1rem; border: 1px solid #312e81;">npm run dev</pre>
                    <p style="color: #64748b;">Or build the production assets using <code>npm run build</code> inside the frontend folder.</p>
                </div>
            `);
        }
    });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port ${port} 🌐`);
});