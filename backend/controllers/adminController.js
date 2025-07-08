const db = require('../db');

// GET all users
exports.getAllUsers = async (req, res, next) => {
  console.log('getAllUsers hit:', req.user);
  try {
    const result = await db.query('SELECT user_id, email, is_admin FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('getAllUsers failed:', err);
    err.status = 500;
    next(err);
  }
};

// GET all orders
exports.getAllOrders = async (req, res, next) => {
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
    err.status = 500;
    next(err);
  }
};

// PATCH order status
exports.updateOrderStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log('Updating order:', id, 'to status:', status);

  try {
    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE order_id = $2 RETURNING *',
      [status, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateOrderStatus failed:', err);
    err.status = 500;
    next(err);
  }
};

// DELETE user
exports.deleteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted', user: result.rows[0] });
  } catch (err) {
    console.error('deleteUser failed:', err);
    err.status = 500;
    next(err);
  }
};

// DELETE product
exports.deleteProduct = async (req, res, next) => {
  try {
    const result = await db.query('DELETE FROM products WHERE product_id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' });
    res.status(204).send();
  } catch (err) {
    console.error('deleteProduct failed:', err);
    err.status = 500;
    next(err);
  }
};

// POST create product
exports.createProduct = async (req, res, next) => {
  const { name, description, price, stock_quantity, image } = req.body;

  if (!name || price == null || stock_quantity == null) {
    return res.status(400).json({ error: 'Name, price, and stock quantity are required' });
  }

  try {
    const result = await db.query(
      `INSERT INTO products (name, description, price, stock_quantity, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, price, stock_quantity, image]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createProduct failed:', err);
    err.status = 500;
    next(err);
  }
};

// PUT update product
exports.updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, price, image_url } = req.body;

  try {
    const result = await db.query(
      'UPDATE products SET name = $1, description = $2, price = $3, image = $4 WHERE product_id = $5 RETURNING *',
      [name, description, price, image_url, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateProduct failed:', err);
    err.status = 500;
    next(err);
  }
};

// GET order items by order ID
exports.getOrderItemsByOrderId = async (req, res, next) => {
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
    console.error('getOrderItemsByOrderId failed:', err);
    err.status = 500;
    next(err);
  }
};

// GET admin metrics
exports.getMetrics = async (req, res, next) => {
  try {
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
    err.status = 500;
    next(err);
  }
};