const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('cookie-session');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');

const logger = require('./middleware/logger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const swaggerDocument = require('./swagger.json');

require('./middleware/passport');

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const userRoutes = require('./routes/user');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS
const DEFAULT_ORIGIN = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOWLIST = (process.env.CORS_ALLOWLIST || DEFAULT_ORIGIN)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWLIST.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS: Origin ${origin} not allowed`), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
  })
);

// Stripe webhook requires raw body BEFORE json()
app.use('/api/checkout/webhook', express.raw({ type: 'application/json' }));

// Core middleware
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(logger);

// Serve uploads (images only) with cache
const imageAllowlist = /\.(?:jpg|jpeg|png|webp|gif|avif)$/i;
app.use('/uploads', (req, res, next) => {
  if (!imageAllowlist.test(req.path)) return res.status(403).send('Forbidden');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Sessions & Passport (if needed)
app.use(
  session({
    name: 'sid',
    maxAge: 24 * 60 * 60 * 1000,
    keys: [process.env.COOKIE_KEY || 'dev_secret_change_me'],
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/users', userRoutes);

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Final middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;