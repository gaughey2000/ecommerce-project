const jwt = require('jsonwebtoken');
const pool = require('../db');

const isAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT role FROM users WHERE user_id = $1', [decoded.userId]);

    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = {
      userId: decoded.userId,
      isAdmin: true
    };
    next();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('isAdmin middleware error:', error.message);
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = isAdmin;