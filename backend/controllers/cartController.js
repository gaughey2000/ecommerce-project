const pool = require('../db');

const addToCart = async (req, res, next) => {
  const { productId, quantity } = req.body;
  const userId = req.user.userId;

  try {
    const product = await pool.query(
      'SELECT stock_quantity FROM products WHERE product_id = $1',
      [productId]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const stock = product.rows[0].stock_quantity;

    const existingItem = await pool.query(
      'SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    const currentQuantity = existingItem.rows.length
      ? existingItem.rows[0].quantity
      : 0;

    const newTotalQuantity = currentQuantity + quantity;
    if (newTotalQuantity > stock) {
      return res.status(400).json({
        error: `Insufficient stock. Only ${stock} available.`,
      });
    }

    if (existingItem.rows.length) {
      const result = await pool.query(
        `UPDATE cart_items
         SET quantity = quantity + $1
         WHERE user_id = $2 AND product_id = $3
         RETURNING *`,
        [quantity, userId, productId]
      );
      return res.status(201).json(result.rows[0]);
    } else {
      const result = await pool.query(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId, productId, quantity]
      );
      return res.status(201).json(result.rows[0]);
    }
  } catch (err) {
    console.error('Add to cart failed:', err);
    err.status = 500;
    next(err);
  }
};

const updateCartQuantity = async (req, res, next) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.userId;

  try {
    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    const item = await pool.query(
      'SELECT product_id FROM cart_items WHERE cart_item_id = $1 AND user_id = $2',
      [cartItemId, userId]
    );
    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    const product = await pool.query(
      'SELECT stock_quantity FROM products WHERE product_id = $1',
      [item.rows[0].product_id]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (quantity > product.rows[0].stock_quantity) {
      return res.status(400).json({
        error: `Insufficient stock. Only ${product.rows[0].stock_quantity} available.`,
      });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND user_id = $3 RETURNING *',
      [quantity, cartItemId, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update cart quantity failed:', err);
    err.status = 500;
    next(err);
  }
};

const removeFromCart = async (req, res, next) => {
  const { cartItemId } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2 RETURNING *',
      [cartItemId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('Remove cart item failed:', err);
    err.status = 500;
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  const { userId } = req.params;
  if (parseInt(userId) !== req.user.userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    res.status(204).send();
  } catch (err) {
    console.error('Clear cart failed:', err);
    err.status = 500;
    next(err);
  }
};

const getCart = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `SELECT ci.cart_item_id, p.product_id, p.name, p.price, ci.quantity
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get cart failed:', err);
    err.status = 500;
    next(err);
  }
};

module.exports = {
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCart,
};