const pool = require('../db');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error(errors.array()[0].msg);
    error.status = 400;
    return next(error);
  }

  const { email, password, username } = req.body;

  try {
    const existing = await pool.query(
      'SELECT user_id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0) {
      const error = new Error('Email or username already in use');
      error.status = 409;
      return next(error);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password, username) VALUES ($1, $2, $3) RETURNING user_id, email, username',
      [email, hashedPassword, username]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.user_id, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      userId: user.user_id,
      email: user.email,
      username: user.username,
      token,
    });
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT user_id, email, username, role, password FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      return next(error);
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      return next(error);
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      userId: user.user_id,
      email: user.email,
      username: user.username,
      role: user.role,
      token,
    });
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    if (parseInt(userId) === req.user.userId) {
      const error = new Error('Cannot delete your own account');
      error.status = 400;
      return next(error);
    }

    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    await pool.query(
      'DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = $1)',
      [userId]
    );
    await pool.query('DELETE FROM orders WHERE user_id = $1', [userId]);

    const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [userId]);

    if (result.rowCount === 0) {
      const error = new Error('User not found');
      error.status = 404;
      return next(error);
    }

    res.json({ message: `User ${userId} deleted` });
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT user_id, email, username, is_admin FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      const error = new Error('User not found');
      error.status = 404;
      return next(error);
    }

    res.json(result.rows[0]);
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT user_id, email, is_admin FROM users');
    res.json(result.rows);
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  const { current, new: newPassword } = req.body;

  if (!current || !newPassword) {
    const error = new Error('Both current and new password are required.');
    error.status = 400;
    return next(error);
  }

  if (newPassword.length < 8) {
    const error = new Error('New password must be at least 8 characters long.');
    error.status = 400;
    return next(error);
  }

  try {
    const result = await pool.query(
      'SELECT password FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    const hashed = result.rows[0]?.password;
    if (!hashed || !(await bcrypt.compare(current, hashed))) {
      const error = new Error('Current password is incorrect.');
      error.status = 401;
      return next(error);
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = $1 WHERE user_id = $2',
      [hashedNew, req.user.userId]
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  const { credential } = req.body;
  if (!credential) {
    const error = new Error('Missing Google credential');
    error.status = 400;
    return next(error);
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const username = payload.name || email.split('@')[0];

    let user = await pool.query('SELECT user_id, email, username, role FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      const insert = await pool.query(
        `INSERT INTO users (email, username, role) VALUES ($1, $2, 'user') RETURNING user_id, email, username, role`,
        [email, username]
      );
      user = insert;
    }

    const token = jwt.sign(
      { userId: user.rows[0].user_id, role: user.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      userId: user.rows[0].user_id,
      email: user.rows[0].email,
      username: user.rows[0].username,
      role: user.rows[0].role,
      token,
    });
  } catch (err) {
    const error = new Error('Google authentication failed');
    error.status = 401;
    next(error);
  }
};

module.exports = {
  register,
  login,
  deleteUser,
  getCurrentUser,
  getAllUsers,
  changePassword,
  googleLogin
};