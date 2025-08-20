const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // <-- bcryptjs
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');

const pool = require('../db');
const authenticate = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

/* ---------------------------- helpers ---------------------------- */

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function roleFromRow(row) {
  // your schema uses is_admin boolean; map to 'admin'|'user'
  return row.is_admin ? 'admin' : 'user';
}

function authResponse(row) {
  const role = roleFromRow(row);
  const token = signToken({ userId: row.user_id, role });
  return {
    token,
    userId: row.user_id,
    email: row.email,
    username: row.username,
    role,
  };
}

function sendValidation(res, req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid input', details: errors.array() });
  }
  return null;
}

/* ----------------------------- routes ---------------------------- */

/**
 * POST /api/auth/register
 * body: { username, email, password }
 */
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 2 }).withMessage('Username too short'),
    body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
  ],
  async (req, res) => {
    if (sendValidation(res, req)) return;

    const { username, email, password } = req.body;
    try {
      const dup = await pool.query(
        'SELECT 1 FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );
      if (dup.rowCount) return res.status(409).json({ error: 'Email or username already in use' });

      const hash = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        `INSERT INTO users (username, email, password, is_admin)
         VALUES ($1, $2, $3, false)
         RETURNING user_id, username, email, is_admin`,
        [username, email, hash]
      );

      return res.status(201).json(authResponse(rows[0]));
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Registration failed' });
    }
  }
);

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post(
  '/login',
  [body('email').isEmail(), body('password').isString()],
  async (req, res) => {
    if (sendValidation(res, req)) return;

    const { email, password } = req.body;
    try {
      const { rows } = await pool.query(
        'SELECT user_id, username, email, password, is_admin FROM users WHERE email = $1',
        [email]
      );
      if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

      return res.json(authResponse(user));
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }
  }
);

/**
 * POST /api/auth/change-password
 * body: { currentPassword, newPassword }
 * auth: required
 */
router.post(
  '/change-password',
  authenticate,
  [body('currentPassword').isString(), body('newPassword').isLength({ min: 8 })],
  async (req, res) => {
    if (sendValidation(res, req)) return;

    const { currentPassword, newPassword } = req.body;
    try {
      const { rows } = await pool.query(
        'SELECT user_id, password FROM users WHERE user_id = $1',
        [req.user.userId]
      );
      if (!rows.length) return res.status(404).json({ error: 'User not found' });

      const user = rows[0];
      const ok = await bcrypt.compare(currentPassword, user.password);
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

      const nextHash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password = $1 WHERE user_id = $2', [nextHash, req.user.userId]);

      return res.json({ message: 'Password updated' });
    } catch (err) {
      console.error('Change-password error:', err);
      return res.status(500).json({ error: 'Failed to update password' });
    }
  }
);

/**
 * POST /api/auth/google
 * body: { credential } // Google ID token
 */
router.post('/google', async (req, res) => {
  try {
    if (!googleClient) return res.status(500).json({ error: 'Google auth not configured' });
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing credential' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ error: 'Google token missing email' });

    const email = payload.email.toLowerCase();
    const username = payload.name?.trim() || email.split('@')[0];

    // Upsert user
    const existing = await pool.query(
      'SELECT user_id, username, email, is_admin FROM users WHERE email = $1',
      [email]
    );

    let userRow;
    if (existing.rowCount) {
      userRow = existing.rows[0];
    } else {
      const inserted = await pool.query(
        `INSERT INTO users (username, email, password, is_admin)
         VALUES ($1, $2, $3, false)
         RETURNING user_id, username, email, is_admin`,
        [username, email, '(google-oauth)'] // placeholder password (not used to login)
      );
      userRow = inserted.rows[0];
    }

    return res.json(authResponse(userRow));
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(401).json({ error: 'Google authentication failed' });
  }
});

module.exports = router;