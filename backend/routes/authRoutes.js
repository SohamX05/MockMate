const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    requestReset, 
    resetPassword 
} = require('../controllers/authController');

// Define Authentication routes
router.post('/register', register);
router.post('/login', login);
router.post('/reset-request', requestReset);
router.post('/reset-password', resetPassword);

module.exports = router;
