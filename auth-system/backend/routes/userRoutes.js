const express = require('express');
const { getProfile, updateProfile, getAllUsers, createUser } = require('../controllers/userController');
const verifyToken = require('../middlewares/authMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');

const router = express.Router();

// Apply standard token verification to all routes here
router.use(verifyToken);

// Own user profile endpoints (anyone logged in)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Management endpoints (requires specific RBAC privilege)
router.get('/', checkPermission('manage_users'), getAllUsers);
router.post('/', checkPermission('manage_users'), createUser);

module.exports = router;
