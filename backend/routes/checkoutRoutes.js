const express = require('express');
const { checkout } = require('../controllers/checkoutController');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/checkout', authenticateToken, checkout);

module.exports = router;