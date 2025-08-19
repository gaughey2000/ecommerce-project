const pool = require('../db');

// Create a new order from user's cart
const createOrder = async (req, res, next) => {
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
    next(err);
  }
};

// Get all orders for the current user
const getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Get one order by ID
const getOrderById = async (req, res, next) => {
  const { orderId } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT order_id, total_amount, status, created_at,
              name AS shipping_name, email AS shipping_email, address AS shipping_address
       FROM orders
       WHERE order_id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Get items for a specific order
const getOrderItemsByOrderId = async (req, res, next) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [orderId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Update order status (admin or user cancel)
const updateOrderStatus = async (req, res, next) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!['pending', 'shipped', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await pool.query(
      `UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *`,
      [status, orderId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Cancel (soft delete) an order
const cancelOrder = async (req, res, next) => {
  const { orderId } = req.params;

  try {
    const result = await pool.query(
      `UPDATE orders SET status = 'cancelled' WHERE order_id = $1 RETURNING *`,
      [orderId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order cancelled', order: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getOrderHistory,
  getOrderById,
  getOrderItemsByOrderId,
  updateOrderStatus,
  cancelOrder,
};