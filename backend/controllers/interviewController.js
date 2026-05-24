const mongoose = require('mongoose');
const Interview = require('../models/interview');
const { generateQuestion, evaluateInterview } = require('../services/geminiService');

// In-memory data store fallback
const inMemoryStore = new Map();

// Max number of technical questions per interview session
const MAX_QUESTIONS = 5;

/**
 * Helper to check if MongoDB is active and connected
 */
const isDbConnected = () => {
    return mongoose.connection.readyState === 1;
};

/**
 * Helper to generate a random mock ID for local storage
 */
const generateMockId = () => {
    return 'mock_' + Math.random().toString(36).substring(2, 11);
};

/**
 * 1. Start a new interview session (associated with logged-in User)
 */
const startInterview = async (req, res) => {
    try {
        const { candidateName, targetRole, resumeText } = req.body;

        if (!candidateName || !targetRole) {
            return res.status(400).json({ error: "Candidate name and target role are required." });
        }

        // Generate the first technical question using Gemini/Mock service
        const firstQuestion = await generateQuestion(targetRole, resumeText || "", []);

        const interviewData = {
            candidateName,
            user: req.user._id, // Hooked up user association!
            targetRole,
            resumeText: resumeText || "",
            status: 'InProgress',
            transcript: [
                {
                    role: 'assistant',
                    content: firstQuestion,
                    timestamp: new Date()
                }
            ],
            evaluation: null
        };

        let interviewSession;

        if (isDbConnected()) {
            try {
                interviewSession = new Interview(interviewData);
                await interviewSession.save();
            } catch (dbError) {
                console.error("Failed to save to MongoDB. Falling back to in-memory store:", dbError.message);
                const mockId = generateMockId();
                interviewSession = { _id: mockId, ...interviewData, createdAt: new Date() };
                inMemoryStore.set(mockId, interviewSession);
            }
        } else {
            const mockId = generateMockId();
            interviewSession = { _id: mockId, ...interviewData, createdAt: new Date() };
            inMemoryStore.set(mockId, interviewSession);
        }

        return res.status(201).json({
            message: "Interview started successfully",
            interviewId: interviewSession._id,
            interview: interviewSession
        });
    } catch (error) {
        console.error("Error in startInterview:", error.message);
        return res.status(500).json({ error: "Failed to initiate interview session." });
    }
};

/**
 * 2. Accept candidate's response and progress the interview (Protected)
 */
const respondToInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { answer } = req.body;

        if (!answer || answer.trim() === '') {
            return res.status(400).json({ error: "Candidate answer is required." });
        }

        let interview;

        // Fetch session from DB or Memory
        if (id.startsWith('mock_') || !isDbConnected()) {
            interview = inMemoryStore.get(id);
        } else {
            try {
                interview = await Interview.findById(id);
            } catch (dbError) {
                console.error("DB Fetch failed, checking local store fallback:", dbError.message);
                interview = inMemoryStore.get(id);
            }
        }

        if (!interview) {
            return res.status(404).json({ error: "Interview session not found." });
        }

        // Security check: Verify the interview belongs to the logged-in user!
        const interviewUserStr = interview.user ? interview.user.toString() : '';
        const loggedUserStr = req.user._id ? req.user._id.toString() : '';
        
        if (interviewUserStr && interviewUserStr !== loggedUserStr) {
            return res.status(403).json({ error: "Not authorized: you do not own this interview session." });
        }

        if (interview.status === 'Completed') {
            return res.status(400).json({ error: "This interview session has already been completed." });
        }

        // 1. Append user response
        const userTurn = {
            role: 'user',
            content: answer,
            timestamp: new Date()
        };
        interview.transcript.push(userTurn);

        // 2. Count current number of assistant questions asked so far
        const questionCount = interview.transcript.filter(t => t.role === 'assistant').length;

        // 3. Determine if we've hit the question limit
        if (questionCount >= MAX_QUESTIONS) {
            // End of interview! Mark as completed and evaluate
            interview.status = 'Completed';

            // Generate structured evaluation
            const evaluation = await evaluateInterview(interview.targetRole, interview.transcript);
            interview.evaluation = evaluation;

            // Save completed state
            if (id.startsWith('mock_') || !isDbConnected()) {
                interview.updatedAt = new Date();
                inMemoryStore.set(id, interview);
            } else {
                await Interview.findByIdAndUpdate(id, { 
                    status: 'Completed', 
                    transcript: interview.transcript,
                    evaluation: interview.evaluation 
                });
            }

            return res.status(200).json({
                message: "Interview completed and evaluated successfully!",
                completed: true,
                interview
            });
        } else {
            // Generate the next adaptive technical question
            const nextQuestion = await generateQuestion(
                interview.targetRole,
                interview.resumeText || "",
                interview.transcript
            );

            // Append the next question to the transcript
            const assistantTurn = {
                role: 'assistant',
                content: nextQuestion,
                timestamp: new Date()
            };
            interview.transcript.push(assistantTurn);

            if (id.startsWith('mock_') || !isDbConnected()) {
                interview.updatedAt = new Date();
                inMemoryStore.set(id, interview);
            } else {
                await Interview.findByIdAndUpdate(id, { 
                    transcript: interview.transcript 
                });
            }

            return res.status(200).json({
                message: "Next question generated.",
                completed: false,
                nextQuestion,
                interview
            });
        }
    } catch (error) {
        console.error("Error in respondToInterview:", error.message);
        return res.status(500).json({ error: "Failed to submit response." });
    }
};

/**
 * 3. Retrieve a single interview details (Protected)
 */
const getInterview = async (req, res) => {
    try {
        const { id } = req.params;
        let interview;

        if (id.startsWith('mock_') || !isDbConnected()) {
            interview = inMemoryStore.get(id);
        } else {
            try {
                interview = await Interview.findById(id);
            } catch (dbError) {
                console.error("DB Fetch failed, checking local store fallback:", dbError.message);
                interview = inMemoryStore.get(id);
            }
        }

        if (!interview) {
            return res.status(404).json({ error: "Interview session not found." });
        }

        // Security check: Verify the interview belongs to the logged-in user
        const interviewUserStr = interview.user ? interview.user.toString() : '';
        const loggedUserStr = req.user._id ? req.user._id.toString() : '';
        
        if (interviewUserStr && interviewUserStr !== loggedUserStr) {
            return res.status(403).json({ error: "Not authorized to access this interview." });
        }

        return res.status(200).json({ interview });
    } catch (error) {
        console.error("Error in getInterview:", error.message);
        return res.status(500).json({ error: "Failed to fetch interview session." });
    }
};

/**
 * 4. List all past interviews of the logged-in user (Protected)
 */
const listInterviews = async (req, res) => {
    try {
        let dbInterviews = [];
        const loggedUserStr = req.user._id ? req.user._id.toString() : '';

        if (isDbConnected()) {
            try {
                // Return sorted by most recent, filtered by logged-in user!
                dbInterviews = await Interview.find({ user: req.user._id }).sort({ createdAt: -1 });
            } catch (dbError) {
                console.error("Failed to fetch interviews from MongoDB:", dbError.message);
            }
        }

        // Filter local in-memory sessions by logged-in user!
        const localInterviews = Array.from(inMemoryStore.values()).filter(item => {
            const itemUserStr = item.user ? item.user.toString() : '';
            return itemUserStr === loggedUserStr;
        });

        // Merge and sort
        const merged = [...dbInterviews, ...localInterviews].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
        });

        return res.status(200).json({ interviews: merged });
    } catch (error) {
        console.error("Error in listInterviews:", error.message);
        return res.status(500).json({ error: "Failed to fetch interview history." });
    }
};

module.exports = {
    startInterview,
    respondToInterview,
    getInterview,
    listInterviews
};
