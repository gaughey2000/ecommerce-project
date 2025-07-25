const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'be559ca8be165b26378495c96854d222217467b0c09...b7efabb7ce2ada01f4324d3873c3be175961f8c6b51a6b2a00a5d4d5fbd68397';
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  console.log(process.env.JWT_SECRET)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Auth middleware hit');
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('✅ JWT_SECRET Loaded:', process.env.JWT_SECRET);
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