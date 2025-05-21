const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', authRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', productRoutes);
app.use('/api', uploadRoutes);
app.use('/api', checkoutRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('E-commerce API is running');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});