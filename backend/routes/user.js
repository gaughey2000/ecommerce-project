const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/auth');
const { body, validationResult } = require('express-validator');


/**
 * Helpers
 */
function toPublicUser(row) {
  return {
    userId: row.user_id,
    username: row.username,
    email: row.email,
  };
}
/**
 * Update current user
 * PATCH /api/users/me
 */
router.patch(
  '/me',
  authenticate,
  [
    body('username').optional().trim().isLength({ min: 2 }).withMessage('Username must be at least 2 characters'),
    body('email').optional().isEmail().withMessage('Email must be valid').normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, email } = req.body;
    if (!username && !email) return res.status(400).json({ error: 'Nothing to update' });

    try {
      // If email provided, ensure it’s not in use by someone else
      if (email) {
        const dup = await pool.query(
          'SELECT 1 FROM users WHERE email = $1 AND user_id <> $2',
          [email, req.user.userId]
        );
        if (dup.rows.length) return res.status(409).json({ error: 'Email already in use' });
      }

      const updates = [];
      const values = [];
      let idx = 1;

      if (username) {
        updates.push(`username = $${idx++}`);
        values.push(username);
      }
      if (email) {
        updates.push(`email = $${idx++}`);
        values.push(email);
      }
      values.push(req.user.userId);

      const result = await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${idx} RETURNING user_id, username, email`,
        values
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

      res.json(toPublicUser(result.rows[0]));
    } catch (err) {
      console.error('User update failed:', err);
      res.status(500).json({ error: 'User update failed' });
    }
  }
);

/**
 * Get current user
 * GET /api/users/me
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, username, email FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(toPublicUser(result.rows[0]));
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});


router.delete('/me', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // delete cart items
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [req.user.userId]);

    // delete order_items for that user's orders
    await client.query(
      `DELETE FROM order_items 
       WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = $1)`,
      [req.user.userId]
    );

    // delete orders
    await client.query('DELETE FROM orders WHERE user_id = $1', [req.user.userId]);

    // delete user
    const del = await client.query(
      'DELETE FROM users WHERE user_id = $1 RETURNING user_id, username, email',
      [req.user.userId]
    );
    if (del.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'User deleted.', user: toPublicUser(del.rows[0]) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('User delete failed:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  } finally {
    client.release();
  }
});

module.exports = router;