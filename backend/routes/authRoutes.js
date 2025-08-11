// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const {
  register,
  login,
  changePassword,
  deleteUser,
  getCurrentUser,
  getAllUsers,
  googleLogin,
} = require('../controllers/authController');

// (optional) rate limiter + validation middleware
// If you don’t have these, you can safely remove them.
const { authLimiter } = require('../middleware/rateLimit');
const { registerValidation, loginValidation } = require('../middleware/validation/authValidation');
const { validate } = require('../middleware/validation/validate');

// ------------------- Auth (public) -------------------

// Register
router.post('/register', registerValidation, validate, authLimiter, register);

// Email/password login
router.post('/login', loginValidation, validate, authLimiter, login);

// Google One Tap / OAuth token (POST body: { credential })
router.post('/google', authLimiter, googleLogin);

// ------------------- Self-service (auth required) -------------------

// Who am I
router.get('/me', auth, getCurrentUser);

// Change password (POST body: { currentPassword, newPassword })
router.post('/change-password', authLimiter, auth, changePassword);

// ------------------- Admin only -------------------

// List all users
router.get('/users', auth, requireRole('admin'), getAllUsers);

// Delete a user by id (not yourself)
router.delete('/users/:userId', auth, requireRole('admin'), deleteUser);

module.exports = router;