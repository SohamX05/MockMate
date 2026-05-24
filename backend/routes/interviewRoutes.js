const express = require('express');
const router = express.Router();
const { 
    startInterview, 
    respondToInterview, 
    getInterview, 
    listInterviews 
} = require('../controllers/interviewController');

// Define API endpoints for the Interviewer
router.post('/start', startInterview);
router.post('/:id/respond', respondToInterview);
router.get('/:id', getInterview);
router.get('/', listInterviews);

module.exports = router;
