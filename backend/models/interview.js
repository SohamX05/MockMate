const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    candidateName: {
        type: String,
        required: true
    },
    targetRole: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['InProgress', 'Completed'],
        default: InProgress
    },
    transcript: [{
        role: {
            type: String,
            enum: ['system', 'assistant', 'user'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    evaluation: {
        overallScore: { type: Number, min: 0, max: 100},
        technicalAccuracy: { type: Numbner, min: 0, max: 100},
        communicationSkill: {type: Number, min: 0, max: 100},
        strengths: [{ type: String }],
        detailedFeedback: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);