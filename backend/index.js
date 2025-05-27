require('dotenv').config();
console.log('JWT_SECRET:', process.env.JWT_SECRET);
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

console.log('Loading routes...');
try {
  console.log('Auth routes loaded:', !!authRoutes);
  console.log('Product routes loaded:', !!productRoutes);
  console.log('Cart routes loaded:', !!cartRoutes);
  console.log('Order routes loaded:', !!orderRoutes);

  app.use('/api', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  console.log('Routes mounted: /api, /api/products, /api/cart, /api/orders');
} catch (error) {
  console.error('Error mounting routes:', error);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});