const pool = require('../db');

const createOrder = async (req, res) => {
  const userId = req.user.userId;
  const { name, email, address } = req.body; // Optional: can collect from frontend

  console.log('Order request:', { userId, name, email, address });

  try {
    // Fetch cart items and their product prices
    const cart = await pool.query(
      `SELECT ci.product_id, ci.quantity, p.price 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cart.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    const total = cart.rows.reduce((sum, item) => sum + item.quantity * item.price, 0);

    // Insert order
    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, name, email, address, status, total_amount) VALUES ($1, $2, $3, $4, $5, $6) RETURNING order_id',
      [userId, name, email, address, 'pending', total]
    );

    const orderId = orderResult.rows[0].order_id;

    // Insert order items
    const queries = cart.rows.map(item =>
      pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      )
    );
    await Promise.all(queries);

    // Clear cart
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    res.status(201).json({ message: 'Order created successfully', orderId });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrderById = async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE order_id = $1', [orderId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getOrderItemsByOrderId = async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [orderId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get order items error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



module.exports = { createOrder, getOrderHistory, getOrderById, getOrderItemsByOrderId };
