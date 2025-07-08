const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;


  if (process.env.NODE_ENV !== 'production') {
    console.log('Auth middleware hit');
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
 
    if (process.env.NODE_ENV !== 'production') {
      console.error('JWT verification error:', err.message);
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = auth;