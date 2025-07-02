const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/auth');

// PATCH /api/users/me
router.patch('/me', authenticate, async (req, res) => {
  const { username, email } = req.body;

  if (!username && !email) {
    return res.status(400).json({ error: 'Nothing to update' });
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

  try {
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${idx} RETURNING user_id, email, username`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('User update failed:', err);
    res.status(500).json({ error: 'User update failed' });
  }
});

module.exports = router;