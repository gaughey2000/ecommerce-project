const pool = require('../db');
const jwt = require('jsonwebtoken');

const register = async (req, res, next) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ error: 'Email, password, and username are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO users (email, password, username) VALUES ($1, crypt($2, gen_salt(\'bf\')), $3) RETURNING user_id, email, username',
      [email, password, username]
    );

    const token = jwt.sign(
      { userId: result.rows[0].user_id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      userId: result.rows[0].user_id,
      email: result.rows[0].email,
      username: result.rows[0].username,
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    error.status = 500;
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT user_id, email, username, is_admin FROM users WHERE email = $1 AND password = crypt($2, password)',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const token = jwt.sign(
      { userId: user.user_id, isAdmin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      userId: user.user_id,
      email: user.email,
      username: user.username,
      isAdmin: user.is_admin,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    error.status = 500;
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  const { userId } = req.params;

  try {
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    await pool.query(
      'DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = $1)',
      [userId]
    );
    await pool.query('DELETE FROM orders WHERE user_id = $1', [userId]);

    const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: `User ${userId} deleted` });
  } catch (error) {
    console.error('Delete user error:', error);
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
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    error.status = 500;
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT user_id, email, is_admin FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    error.status = 500;
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  const { current, new: newPassword } = req.body;

  if (!current || !newPassword) {
    return res.status(400).json({ error: 'Both current and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
  }

  try {
    const result = await pool.query(
      'SELECT user_id FROM users WHERE user_id = $1 AND password = crypt($2, password)',
      [req.user.userId, current]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    await pool.query(
      'UPDATE users SET password = crypt($1, gen_salt(\'bf\')) WHERE user_id = $2',
      [newPassword, req.user.userId]
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    error.status = 500;
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
};