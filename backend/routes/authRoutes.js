const express = require('express');
const router = express.Router();
const { register, login, deleteUser, getCurrentUser, getAllUsers, changePassword } = require('../controllers/authController');
const isAdmin = require('../middleware/isAdmin');
const auth = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { registerValidation, loginValidation } = require('../middleware/validation/authValidation');

   router.post('/register', registerValidation, authLimiter ,register);
   router.post('/login',authLimiter, loginValidation ,login);
   router.delete('/users/:userId', auth, isAdmin, deleteUser);
   router.get('/me', auth, getCurrentUser);
   router.get('/users', auth, isAdmin, getAllUsers);
   router.post('/change-password', auth, authLimiter, changePassword);
   module.exports = router;