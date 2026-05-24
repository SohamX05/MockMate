const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    startInterview, 
    respondToInterview, 
    getInterview, 
    listInterviews 
} = require('../controllers/interviewController');

// Secure all interview endpoints using JWT protection
router.use(protect);

router.post('/start', startInterview);
router.post('/:id/respond', respondToInterview);
router.get('/:id', getInterview);
router.get('/', listInterviews);

module.exports = router;
