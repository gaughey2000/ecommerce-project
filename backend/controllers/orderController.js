const pool = require('../db');

const createOrder = async (req, res) => {
  const userId = req.user.userId;
  console.log('Order request:', { userId });
  try {
    const cart = await pool.query(
      'SELECT ci.product_id, ci.quantity, p.price FROM cart_items ci ' +
      'JOIN products p ON ci.product_id = p.product_id ' +
      'WHERE ci.user_id = $1',
      [userId]
    );
    if (cart.rows.length === 0) {
      return res.status(400).send('Cart is empty');
    }

    const total = cart.rows.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const order = await pool.query(
      'INSERT INTO orders (user_id, status, total_amount) VALUES ($1, $2, $3) RETURNING order_id',
      [userId, 'pending', total]
    );
    const orderId = order.rows[0].order_id;

    for (const item of cart.rows) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    res.json({ orderId });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: err.message });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { createOrder, getOrderHistory };