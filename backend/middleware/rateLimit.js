const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // limit each IP to 5 requests per windowMs
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter };