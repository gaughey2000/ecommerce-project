const pool = require('../db');

// Helper to validate and sanitise input quantity
function sanitiseQuantity(qty) {
  const parsed = parseInt(qty, 10);
  if (isNaN(parsed) || parsed < 1) return null;
  return parsed;
}

// Add item to cart
exports.addToCart = async (req, res, next) => {
  const userId = req.user.userId;
  const { productId, quantity } = req.body;

  const qty = sanitiseQuantity(quantity);
  if (!productId || !qty) {
    return res.status(400).json({ error: 'Invalid product or quantity' });
  }

  try {
    const stockCheck = await pool.query(
      'SELECT stock_quantity FROM products WHERE product_id = $1',
      [productId]
    );
    if (stockCheck.rows.length === 0) return res.status(404).json({ error: 'Product not found' });

    const stock = stockCheck.rows[0].stock_quantity;

    const existing = await pool.query(
      'SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );

    const currentQty = existing.rows[0]?.quantity || 0;
    const totalQty = currentQty + qty;

    if (totalQty > stock) {
      return res.status(400).json({ error: `Only ${stock} left in stock` });
    }

    if (existing.rows.length) {
      const updated = await pool.query(
        `UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3 RETURNING *`,
        [totalQty, userId, productId]
      );
      return res.status(201).json(updated.rows[0]);
    } else {
      const inserted = await pool.query(
        `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *`,
        [userId, productId, qty]
      );
      return res.status(201).json(inserted.rows[0]);
    }
  } catch (err) {
    console.error('addToCart error:', err);
    next(err);
  }
};

// Update item quantity
exports.updateCartQuantity = async (req, res, next) => {
  const userId = req.user.userId;
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  const qty = sanitiseQuantity(quantity);
  if (!qty) return res.status(400).json({ error: 'Invalid quantity' });

  try {
    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND user_id = $3 RETURNING *`,
      [qty, cartItemId, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Cart item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateCartQuantity error:', err);
    next(err);
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res, next) => {
  const userId = req.user.userId;
  const { cartItemId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2 RETURNING *`,
      [cartItemId, userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Item not found' });
    res.status(204).send();
  } catch (err) {
    console.error('removeFromCart error:', err);
    next(err);
  }
};

// Clear entire cart
exports.clearCart = async (req, res, next) => {
  const { userId } = req.params;

  if (parseInt(userId) !== req.user.userId) {
    return res.status(403).json({ error: 'You can only clear your own cart' });
  }

  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    res.status(204).send();
  } catch (err) {
    console.error('clearCart error:', err);
    next(err);
  }
};

// Fetch current cart contents
exports.getCart = async (req, res, next) => {
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
    console.error('getCart error:', err);
    next(err);
  }
};