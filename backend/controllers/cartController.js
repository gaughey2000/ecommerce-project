const pool = require('../db');

const addToCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.userId;
  console.log('Cart request:', { userId, productId, quantity });
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
    const currentQuantity = existingItem.rows.length > 0 ? existingItem.rows[0].quantity : 0;
    const newTotalQuantity = currentQuantity + quantity;

    if (newTotalQuantity > stock) {
      return res.status(400).json({ error: `Insufficient stock. Only ${stock} available.` });
    }

    if (existingItem.rows.length > 0) {
      const result = await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
        [quantity, userId, productId]
      );
      console.log('Cart item updated:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      const result = await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [userId, productId, quantity]
      );
      console.log('Cart item inserted:', result.rows[0]);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Cart error:', err);
    res.status(500).json({ error: err.message });
  }
};

const updateCartQuantity = async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.userId;
  console.log('Update cart request:', { cartItemId, quantity });
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
    const productId = item.rows[0].product_id;

    const product = await pool.query(
      'SELECT stock_quantity FROM products WHERE product_id = $1',
      [productId]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const stock = product.rows[0].stock_quantity;

    if (quantity > stock) {
      return res.status(400).json({ error: `Insufficient stock. Only ${stock} available.` });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND user_id = $3 RETURNING *',
      [quantity, cartItemId, userId]
    );
    console.log('Cart item updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: err.message });
  }
};

const removeFromCart = async (req, res) => {
  const { cartItemId } = req.params;
  const userId = req.user.userId;
  console.log('Remove cart item request:', { cartItemId });
  try {
    const result = await pool.query(
      'DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2 RETURNING *',
      [cartItemId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    console.log('Cart item deleted:', result.rows[0]);
    res.status(204).send();
  } catch (err) {
    console.error('Remove cart error:', err);
    res.status(500).json({ error: err.message });
  }
};

const clearCart = async (req, res) => {
  const { userId } = req.params;
  if (parseInt(userId) !== req.user.userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  console.log('Clear cart request:', { userId });
  try {
    const result = await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1 RETURNING *',
      [userId]
    );
    console.log('Cart cleared:', result.rows);
    res.status(204).send();
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addToCart, updateCartQuantity, removeFromCart, clearCart };