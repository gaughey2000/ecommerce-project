const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { createOrder, getOrderHistory, getOrderById, getOrderItemsByOrderId } = require('../controllers/orderController');
const { orderValidation } = require('../middleware/validation/orderValidation');
const { validate } = require('../middleware/validation/validate');


router.post('/', authenticateToken, orderValidation, validate, createOrder);
router.get('/', authenticateToken, getOrderHistory);
router.get('/:orderId', authenticateToken, getOrderById);
router.get('/:orderId/items', authenticateToken, getOrderItemsByOrderId);


module.exports = router;
