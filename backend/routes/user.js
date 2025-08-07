const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middleware/auth');
const { uploadProfileImage, multerUpload } = require('../controllers/uploadController');

// 🟢 Profile Image Upload Route
router.post('/me/image', authenticate, multerUpload.single('image'), uploadProfileImage);

// 🟢 Update User Details (PATCH)
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
      `UPDATE users SET ${updates.join(', ')} WHERE user_id = $${idx} RETURNING user_id, email, username, profile_image`,
      values
    );

    const user = result.rows[0];
    if (user.profile_image) {
      user.profile_image = `${process.env.BASE_URL || 'http://localhost:3000'}${user.profile_image}`;
    }

    res.json(user);
  } catch (err) {
    console.error('User update failed:', err);
    res.status(500).json({ error: 'User update failed' });
  }
});

// 🟢 Get Current User Details
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, username, email, profile_image FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (user.profile_image) {
      user.profile_image = `${process.env.BASE_URL || 'http://localhost:3000'}${user.profile_image}`;
    }

    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// 🟢 Delete User
router.delete('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE user_id = $1 RETURNING user_id, email, username',
      [req.user.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deleted.',
      user: result.rows[0],
    });
  } catch (err) {
    console.error('User delete failed:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;