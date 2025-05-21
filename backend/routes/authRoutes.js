const express = require('express');
   const router = express.Router();
   const { register, login, deleteUser, getCurrentUser, getAllUsers } = require('../controllers/authController');
   const isAdmin = require('../middleware/isAdmin');
   const auth = require('../middleware/auth');

   router.post('/register', register);
   router.post('/login', login);
   router.delete('/users/:userId', auth, isAdmin, deleteUser);
   router.get('/me', auth, getCurrentUser);
   router.get('/users', auth, isAdmin, getAllUsers);

   module.exports = router;