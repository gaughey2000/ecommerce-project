// backend/controllers/adminController.js
const db = require('../db');

/**
 * Helpers
 */
function toNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : null;
}
function assert(condition, message, status = 400) {
  if (!condition) {
    const err = new Error(message);
    err.status = status;
    throw err;
  }
}
const ALLOWED_ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

/**
 * USERS
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT user_id, email, username, role
         FROM users
        ORDER BY user_id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    err.status = 500;
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM users WHERE user_id = $1 RETURNING user_id, email, username',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted', user: result.rows[0] });
  } catch (err) {
    err.status = 500;
    next(err);
  }
};

/**
 * ORDERS
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT 
          o.order_id,
          o.user_id,
          u.email AS user_email,
          o.status,
          o.total_amount,
          o.created_at,
          o.stripe_session_id,
          o.stripe_payment_intent
        FROM orders o
        JOIN users u ON u.user_id = o.user_id
        ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    err.status = 500;
    next(err);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    assert(ALLOWED_ORDER_STATUSES.includes(status), 'Invalid order status');

    const result = await db.query(
      `UPDATE orders
          SET status = $1
        WHERE order_id = $2
        RETURNING order_id, status, total_amount, created_at`,
      [status, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (!err.status) err.status = 500;
    next(err);
  }
};

exports.getOrderItemsByOrderId = async (req, res, next) => {
  const { id } = req.params; // note: in routes you used /admin/orders/:id/items
  try {
    const { rows } = await db.query(
      `SELECT 
          oi.order_item_id,
          oi.product_id,
          p.name AS product_name,
          oi.quantity,
          oi.unit_price
        FROM order_items oi
        JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = $1`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    err.status = 500;
    next(err);
  }
};

/**
 * PRODUCTS
 * NOTE: Your DB now expects unit_amount (minor units) & currency.
 * We compute unit_amount from price and default currency to GBP.
 */

exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description = null,
      price,              // major units, e.g. 10.00
      stock_quantity,
      image = null,
      currency = 'GBP',
    } = req.body;

    assert(name, 'Name is required');
    const priceNumber = toNumber(price);
    const stockNumber = Number.isInteger(Number(stock_quantity)) ? Number(stock_quantity) : null;

    assert(priceNumber !== null && priceNumber > 0, 'Price must be a positive number');
    assert(stockNumber !== null && stockNumber >= 0, 'Stock quantity must be a non-negative integer');

    const unit_amount = Math.round(priceNumber * 100); // minor units

    const result = await db.query(
      `INSERT INTO products
        (name, description, price, stock_quantity, image, unit_amount, currency, is_active, created_at)
       VALUES ($1,   $2,          $3,    $4,             $5,    $6,          UPPER($7), true,      CURRENT_TIMESTAMP)
       RETURNING product_id, name, description, price, stock_quantity, image, unit_amount, currency, is_active, created_at`,
      [name, description, priceNumber, stockNumber, image, unit_amount, currency || 'GBP']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (!err.status) err.status = 500;
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const {
      name,
      description = null,
      price,              // major units
      stock_quantity,
      image = null,
      currency = 'GBP',
    } = req.body;

    assert(name, 'Name is required');
    const priceNumber = toNumber(price);
    const stockNumber = Number.isInteger(Number(stock_quantity)) ? Number(stock_quantity) : null;

    assert(priceNumber !== null && priceNumber > 0, 'Price must be a positive number');
    assert(stockNumber !== null && stockNumber >= 0, 'Stock quantity must be a non-negative integer');

    const unit_amount = Math.round(priceNumber * 100);

    const result = await db.query(
      `UPDATE products
          SET name = $1,
              description = $2,
              price = $3,
              stock_quantity = $4,
              image = $5,
              unit_amount = $6,
              currency = UPPER($7)
        WHERE product_id = $8
          AND (is_active IS DISTINCT FROM false OR is_active = true)
        RETURNING product_id, name, description, price, stock_quantity, image, unit_amount, currency, is_active, created_at`,
      [name, description, priceNumber, stockNumber, image, unit_amount, currency || 'GBP', id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found or is archived' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (!err.status) err.status = 500;
    next(err);
  }
};

exports.archiveProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `UPDATE products
          SET is_active = false
        WHERE product_id = $1
        RETURNING product_id`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product archived successfully', id: result.rows[0].product_id });
  } catch (err) {
    err.status = 500;
    next(err);
  }
};

// Optional hard delete (if you still expose it)
exports.deleteProduct = async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM products WHERE product_id = $1',
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(204).send();
  } catch (err) {
    err.status = 500;
    next(err);
  }
};

/**
 * METRICS
 */
exports.getMetrics = async (req, res, next) => {
  try {
    const usersResult = await db.query('SELECT COUNT(*)::int AS count FROM users');
    const ordersResult = await db.query('SELECT COUNT(*)::int AS count FROM orders');
    const productsResult = await db.query('SELECT COUNT(*)::int AS count FROM products WHERE COALESCE(is_active, true) = true');

    res.json({
      totalUsers: usersResult.rows[0].count,
      totalOrders: ordersResult.rows[0].count,
      totalProducts: productsResult.rows[0].count,
    });
  } catch (err) {
    err.status = 500;
    next(err);
  }
};