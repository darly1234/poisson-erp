const express = require('express');
const { register, login, forgotPassword, resetPassword, verifyEmail, autoLoginMaster } = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/auto-login-master', autoLoginMaster);

module.exports = router;
