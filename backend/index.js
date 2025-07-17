const path = require('path');
require('dotenv').config();

const session = require('cookie-session');
const passport = require('passport');
require('./middleware/passport');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const compression = require('compression');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const userRoutes = require('./routes/user');

const logger = require('./middleware/logger');

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --- Security and Hardening ---
app.set('trust proxy', 1); // Needed if behind proxy (e.g. Heroku, Railway)
app.disable('x-powered-by'); // Don't leak Express
app.use(helmet()); // Set secure HTTP headers

// --- CORS and JSON ---
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, filePath) => {
    if (!filePath.match(/\.(jpg|jpeg|png|webp)$/i)) {
      res.statusCode = 403;
      return res.end('Forbidden');
    }
  }
}));

// --- DB Connection ---
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  port: parseInt(process.env.PGPORT, 10),
  password: process.env.PGPASSWORD || undefined,
});

pool
  .connect()
  .then(() => console.log('🔌 Connected to the ecommerce database'))
  .catch(err => console.error('❌ DB connection error:', err));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/users', userRoutes);
app.use(logger);
app.use(compression());

app.use(session({
  maxAge: 24 * 60 * 60 * 1000,
  keys: [process.env.COOKIE_KEY || 'secret']
}));
app.use(passport.initialize());
app.use(passport.session());
// --- Fallbacks ---
app.use(notFound);
app.use(errorHandler);

// --- Serve frontend in production ---
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../client/build');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, pool };