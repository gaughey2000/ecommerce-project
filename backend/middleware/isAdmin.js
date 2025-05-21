const jwt = require('jsonwebtoken');
   const pool = require('../db');

   const isAdmin = async (req, res, next) => {
     try {
       const token = req.header('Authorization')?.replace('Bearer ', '');
       if (!token) return res.status(401).json({ error: 'No token provided' });

       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const result = await pool.query('SELECT is_admin FROM users WHERE user_id = $1', [decoded.userId]);
       
       if (result.rows.length === 0 || !result.rows[0].is_admin) {
         return res.status(403).json({ error: 'Admin access required' });
       }
       
       req.user = { userId: decoded.userId, isAdmin: result.rows[0].is_admin };
       next();
     } catch (error) {
       console.error('Admin auth error:', error);
       res.status(401).json({ error: 'Invalid token' });
     }
   };

   module.exports = isAdmin;