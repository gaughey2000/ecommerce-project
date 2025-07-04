const db = require('../db');

exports.getAllUsers = async (req, res) => {
  console.log('getAllUsers hit:', req.user);
    try {
      console.log('Fetching all users...');
      const result = await db.query('SELECT user_id, email, is_admin FROM users');
      res.json(result.rows);
    } catch (err) {
      console.error('getAllUsers failed:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  };

  exports.getAllOrders = async (req, res) => {
    try {
      const result = await db.query(`
        SELECT 
          o.order_id,
          o.status,
          o.created_at,
          o.total_amount,
          u.email AS user_email
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        ORDER BY o.created_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error('getAllOrders failed:', err);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  };

  exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params; // Matches ':id' in the route
    const { status } = req.body;
  
    console.log('Updating order:', id, 'with status:', status);
  
    try {
      const result = await db.query(
        'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
        [status, id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
  
      res.json(result.rows[0]);
    } catch (err) {
      console.error('updateOrderStatus failed:', err);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  };

  exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
      const result = await db.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'User deleted', user: result.rows[0] });
    } catch (err) {
      console.error('deleteUser failed:', err);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  };
  

  exports.deleteProduct = async (req, res) => {
    try {
      const result = await db.query('DELETE FROM products WHERE product_id = $1', [req.params.id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.status(204).send();
    } catch (err) {
      console.error('deleteProduct failed:', err);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  };

  exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, image_url } = req.body;
  
    try {
      const result = await db.query(
        'UPDATE products SET name = $1, description = $2, price = $3, image_url = $4 WHERE product_id = $5 RETURNING *',
        [name, description, price, image_url, id]
      );
      if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error('updateProduct failed:', err);
      res.status(500).json({ error: 'Failed to update product' });
    }
  };
  exports.getOrderItemsByOrderId = async (req, res) => {
    const orderId = req.params.id;
    try {
      const result = await db.query(`
        SELECT oi.quantity, oi.unit_price, p.name AS product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        WHERE oi.order_id = $1
      `, [orderId]);
  
      res.json(result.rows);
    } catch (err) {
      console.error('Failed to fetch order items:', err);
      res.status(500).json({ error: 'Could not retrieve order items' });
    }
  };

  exports.getMetrics = async (req, res) => {
    try{
      const usersResult = await db.query('SELECT COUNT(*) FROM users');
      const ordersResult = await db.query('SELECT COUNT(*) FROM orders');
      const productsResult = await db.query('SELECT COUNT(*) FROM products');
  
      res.json({
        totalUsers: parseInt(usersResult.rows[0].count, 10),
        totalOrders: parseInt(ordersResult.rows[0].count, 10),
        totalProducts: parseInt(productsResult.rows[0].count, 10),
      });
    } catch (err) {
      console.error('getMetrics failed:', err);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  }