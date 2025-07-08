const pool = require('../db');
const { validationResult, body, param } = require('express-validator');

// Create a new order from user's cart
const createOrder = async (req, res) => {
  const userId = req.user.userId;
  const { name, email, address } = req.body;

  if (!name || !email || !address) {
    return res.status(400).json({ error: 'Missing name, email or address' });
  }

  try {
    const cart = await pool.query(
      `SELECT ci.product_id, ci.quantity, p.price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cart.rows.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    const total = cart.rows.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, name, email, address, status, total_amount)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING order_id`,
      [userId, name, email, address, total]
    );
    const orderId = orderResult.rows[0].order_id;

    await Promise.all(
      cart.rows.map(item =>
        pool.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [orderId, item.product_id, item.quantity, item.price]
        )
      )
    );

    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    res.status(201).json({ message: 'Order placed successfully', orderId });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Order creation failed' });
  }
};

// Get all orders for the current user
const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch order history error:', err);
    res.status(500).json({ error: 'Could not retrieve orders' });
  }
};

// Get one order by ID
const getOrderById = async (req, res) => {
  const { orderId } = req.params;
  if (!/^[0-9]+$/.test(orderId)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE order_id = $1',
      [orderId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fetch single order error:', err);
    res.status(500).json({ error: 'Could not retrieve order' });
  }
};

// Get items for a specific order
const getOrderItemsByOrderId = async (req, res) => {
  const { orderId } = req.params;
  if (!/^[0-9]+$/.test(orderId)) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }
  try {
    const result = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [orderId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch order items error:', err);
    res.status(500).json({ error: 'Could not retrieve order items' });
  }
};

module.exports = {
  createOrder,
  getOrderHistory,
  getOrderById,
  getOrderItemsByOrderId
};