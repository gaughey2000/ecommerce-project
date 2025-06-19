console.log('⚙️ Mounting POST /api/checkout');
const express = require('express');
const { checkout } = require('../controllers/checkoutController');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticateToken, checkout);

module.exports = router;