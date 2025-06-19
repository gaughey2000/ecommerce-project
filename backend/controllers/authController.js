const pool = require('../db');
const jwt = require('jsonwebtoken');


const register = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, crypt($2, gen_salt(\'bf\'))) RETURNING user_id, email',
      [email, password]
    );
    const token = jwt.sign({ userId: result.rows[0].user_id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ userId: result.rows[0].user_id, email: result.rows[0].email, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = crypt($2, password)',
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
      isAdmin: user.is_admin,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = $1)', [userId]);
    await pool.query('DELETE FROM orders WHERE user_id = $1', [userId]);
    const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING user_id', [userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: `User ${userId} deleted` });
  } catch (error) {
    console.error('Delete user error:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, email, is_admin FROM users WHERE user_id = $1', [req.user.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, email, is_admin FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = { register, login, deleteUser, getCurrentUser, getAllUsers };