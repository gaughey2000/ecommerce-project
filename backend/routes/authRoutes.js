const express = require('express');
const router = express.Router();
const passport = require('passport'); // 👈 for Google OAuth

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
const { validate } = require('../middleware/validation/validate');
const jwt = require('jsonwebtoken');
const { googleLogin } = require('../controllers/authController');


// Auth routes
router.post('/register', registerValidation, validate, authLimiter, register);
router.post('/login', loginValidation, validate, authLimiter, login);
router.post('/google', googleLogin);
// Admin-only
router.delete('/users/:userId', auth, requireRole('admin'), deleteUser);
router.get('/users', auth, requireRole('admin'), getAllUsers);

// User-only
router.get('/me', auth, getCurrentUser);
router.post('/change-password', authLimiter, auth, changePassword);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`${process.env.CLIENT_URL}/login?token=${token}`);
  }
);

module.exports = router;