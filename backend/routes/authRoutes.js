const express = require('express');
const router = express.Router();

const {
  register,
  login,
  deleteUser,
  getCurrentUser,
  getAllUsers,
  changePassword
} = require('../controllers/authController');

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { authLimiter } = require('../middleware/rateLimit');
const { registerValidation, loginValidation } = require('../middleware/validation/authValidation');
const { validate } = require('../middleware/validation/validate'); // 👈 Add this

// Auth routes
router.post('/register', registerValidation, validate, authLimiter, register);
router.post('/login', loginValidation, validate, authLimiter, login);

// Admin-only
router.delete('/users/:userId', auth, requireRole('admin'), deleteUser);
router.get('/users', auth, requireRole('admin'), getAllUsers);

// User-only
router.get('/me', auth, getCurrentUser);
router.post('/change-password', authLimiter, auth, changePassword);

module.exports = router;