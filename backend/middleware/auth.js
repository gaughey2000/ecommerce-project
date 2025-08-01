const jwt = require('jsonwebtoken');
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  console.log('🟢 Incoming Auth Header:', authHeader);

  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET not defined');
    throw new Error('JWT_SECRET not defined in environment');
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ No token provided in Authorization header');
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ JWT verification failed:', err.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

module.exports = auth;