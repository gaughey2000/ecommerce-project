const jwt = require('jsonwebtoken');
const pool = require('../db');

function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed token' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const { rows } = await pool.query(
        'SELECT role FROM users WHERE user_id = $1',
        [decoded.userId]
      );

      const user = rows[0];
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Access denied: insufficient role' });
      }

      req.user = {
        userId: decoded.userId,
        role: user.role
      };

      if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Role check passed for:', req.user);
      }

      next();
    } catch (err) {
      console.error('❌ requireRole error:', err.message);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}

module.exports = requireRole;