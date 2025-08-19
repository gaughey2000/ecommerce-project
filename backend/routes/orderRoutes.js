const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const pool = require('../db');
const {
  createOrder,
  getOrderHistory,
  getOrderById,
  getOrderItemsByOrderId,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/orderController');
const { orderValidation } = require('../middleware/validation/orderValidation');
const { validate } = require('../middleware/validation/validate');

// Create new order
router.post('/', authenticateToken, orderValidation, validate, createOrder);

// Get all orders for logged-in user
router.get('/', authenticateToken, getOrderHistory);

// Get order by Stripe session
router.get('/by-session/:sessionId', authenticateToken, async (req, res) => {
  const { sessionId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT order_id, user_id, total_amount, status, created_at,
              name AS shipping_name, email AS shipping_email, address AS shipping_address,
              stripe_session_id, stripe_payment_intent
       FROM orders
       WHERE stripe_session_id = $1 AND user_id = $2`,
      [sessionId, req.user.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Get one order by ID
router.get('/:orderId', authenticateToken, getOrderById);

// Get items of an order
router.get('/:orderId/items', authenticateToken, getOrderItemsByOrderId);

// Update order (status)
router.patch('/:orderId', authenticateToken, updateOrderStatus);

// Cancel order (soft delete)
router.delete('/:orderId', authenticateToken, cancelOrder);

module.exports = router;