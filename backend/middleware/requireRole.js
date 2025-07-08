const jwt = require('jsonwebtoken');
const pool = require('../db');

function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Missing token' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { rows } = await pool.query('SELECT role FROM users WHERE user_id = $1', [decoded.userId]);

      const user = rows[0];
      if (!user || !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Access denied: insufficient role' });
      }

      req.user = { userId: decoded.userId, role: user.role };
      next();
    } catch (err) {
      console.error('requireRole error:', err);
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

module.exports = requireRole;