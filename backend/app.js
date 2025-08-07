const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const session = require('cookie-session');
const passport = require('passport');
require('./middleware/passport');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const logger = require('./middleware/logger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const userRoutes = require('./routes/user');

// DB setup
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  port: parseInt(process.env.PGPORT, 10),
  password: process.env.PGPASSWORD || undefined,
});

pool.query('SELECT 1')
  .then(() => console.log('🔌 Connected to the ecommerce database'))
  .catch(err => console.error('❌ DB connection error:', err));

// Initialise app
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security & Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10kb' }));
app.use(compression());
app.use(logger);

// 🟢 FIXED: Serve uploads with correct CORS headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    if (!filePath.match(/\.(jpg|jpeg|png|webp)$/i)) {
      res.statusCode = 403;
      return res.end('Forbidden');
    }
  }
}));

// Sessions & Passport
app.use(session({
  maxAge: 24 * 60 * 60 * 1000,
  keys: [process.env.COOKIE_KEY || 'secret']
}));
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/users', userRoutes);

// Final middleware
app.use(notFound);
app.use(errorHandler);

module.exports = { app, pool };