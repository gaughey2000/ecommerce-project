const pool = require('../db');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const SALT_ROUNDS = 10;

// Helper: sign JWT in a consistent way
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
const register = async (req, res, next) => {
  // express-validator results (username, email, password rules handled in middleware)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, password, username } = req.body;

  try {
    // unique email/username
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email or username already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
      `INSERT INTO users (email, password, username, role)
       VALUES ($1, $2, $3, 'user')
       RETURNING user_id, email, username, role`,
      [email, hashedPassword, username]
    );

    const user = result.rows[0];

    const token = signToken({ userId: user.user_id, role: user.role });

    res.status(201).json({
      userId: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT user_id, email, username, role, password FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ userId: user.user_id, role: user.role });

    res.json({
      userId: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new password are required.' });
  }

  // Basic strength checks (aligns with registration rules)
  if (
    newPassword.length < 8 ||
    !/[A-Z]/.test(newPassword) ||
    !/\d/.test(newPassword)
  ) {
    return res.status(400).json({
      error: 'New password must be 8+ chars and include 1 uppercase & 1 number.',
    });
  }

  try {
    const result = await pool.query(
      'SELECT password FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashed = result.rows[0].password;
    const isMatch = await bcrypt.compare(currentPassword, hashed);

    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashedNew = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query(
      'UPDATE users SET password = $1 WHERE user_id = $2',
      [hashedNew, req.user.userId]
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/users/:userId  (admin-only route in router)
const deleteUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    if (parseInt(userId, 10) === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    await pool.query(
      'DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = $1)',
      [userId]
    );
    await pool.query('DELETE FROM orders WHERE user_id = $1', [userId]);

    const result = await pool.query(
      'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: `User ${userId} deleted` });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
const getCurrentUser = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT user_id, email, username, role FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/users (admin)
const getAllUsers = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT user_id, email, username, role FROM users');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/google
const googleLogin = async (req, res, next) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const username = payload.name || email.split('@')[0];


    let query = await pool.query(
      'SELECT user_id, email, username, role FROM users WHERE email = $1',
      [email]
    );

    if (query.rows.length === 0) {
      const insert = await pool.query(
        `INSERT INTO users (email, username, role)
         VALUES ($1, $2, 'user')
         RETURNING user_id, email, username, role`,
        [email, username]
      );
      query = insert;
    }

    const u = query.rows[0];
    const token = signToken({ userId: u.user_id, role: u.role });

    res.json({
      userId: u.user_id,
      email: u.email,
      username: u.username,
      role: u.role,
      token,
    });
  } catch (err) {
    console.error('Google login error:', err);
    next(new Error('Google authentication failed'));
  }
};

module.exports = {
  register,
  login,
  changePassword,
  deleteUser,
  getCurrentUser,
  getAllUsers,
  googleLogin,
};