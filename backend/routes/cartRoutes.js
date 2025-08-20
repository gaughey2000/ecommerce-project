const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pool = require('../db');
const { clearCart } = require('../controllers/cartController');
// GET /api/cart
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT ci.cart_item_id, ci.quantity, p.product_id, p.name,
              COALESCE(p.price, p.unit_amount/100.0) AS price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Cart GET error:', err);
    res.status(500).json({ error: 'Failed to load cart' });
  }
});

// POST /api/cart
router.post('/', auth, async (req, res) => {
  const userId = req.user.userId;

  // accept either product_id or productId
  const { product_id, productId, quantity } = req.body;
  const pid = Number(product_id || productId);
  const qty = parseInt(quantity, 10);

  if (!pid || !qty || qty < 1) {
    return res.status(400).json({ error: 'Invalid product or quantity' });
  }

  try {
    // optional: ensure product exists
    const prod = await pool.query('SELECT product_id FROM products WHERE product_id = $1', [pid]);
    if (prod.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // upsert into cart
    const existing = await pool.query(
      `SELECT cart_item_id FROM cart_items WHERE user_id = $1 AND product_id = $2`,
      [userId, pid]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE cart_items SET quantity = quantity + $1 WHERE cart_item_id = $2`,
        [qty, existing.rows[0].cart_item_id]
      );
    } else {
      await pool.query(
        `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)`,
        [userId, pid, qty]
      );
    }

    res.status(201).json({ message: 'Added to cart' });
  } catch (err) {
    console.error('Cart POST error:', err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PATCH /api/cart/:id
router.patch('/:id', auth, async (req, res) => {
  const userId = req.user.userId;
  const cartItemId = req.params.id;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: 'Invalid quantity' });
  }

  try {
    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND user_id = $3`,
      [quantity, cartItemId, userId]
    );

    res.json({ message: 'Cart updated' });
  } catch (err) {
    console.error('Cart PATCH error:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', auth, async (req, res) => {
  const userId = req.user.userId;
  const cartItemId = req.params.id;

  try {
    await pool.query(
      `DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2`,
      [cartItemId, userId]
    );

    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    console.error('Cart DELETE error:', err);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});


// Clear all items in the current user's cart
router.post('/clear', auth, clearCart);

module.exports = router;