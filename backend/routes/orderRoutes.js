const express = require('express');
const { createOrder, getOrderHistory } = require('../controllers/orderController');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/orders', authenticateToken, createOrder);
router.get('/orders/user/:userId', authenticateToken, getOrderHistory);

module.exports = router;