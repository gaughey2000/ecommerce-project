const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.USER,
  host: 'localhost',
  database: 'ecommerce',
  password: '',
  port: 5432
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Failed to connect to the database:', err.stack);
    return;
  }
  console.log('Successfully connected to the ecommerce database');
  release();
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Server error');
  }
});

// Add to cart
app.post('/api/cart', async (req, res) => {
  const { userId, productId, quantity } = req.body;
  console.log('Cart request:', { userId, productId, quantity });
  try {
    // Insert into cart_items
    const result = await pool.query(
      'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [userId, productId, quantity]
    );
    console.log('Cart insert:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Cart error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  const { userId } = req.body;
  console.log('Order request:', { userId });
  try {
    const cart = await pool.query(
      'SELECT ci.product_id, ci.quantity, p.price FROM cart_items ci ' +
      'JOIN products p ON ci.product_id = p.product_id ' +
      'WHERE ci.user_id = $1',
      [userId]
    );
    if (cart.rows.length === 0) {
      return res.status(400).send('Cart is empty');
    }

    const total = cart.rows.reduce((sum, item) => sum + item.quantity * item.price, 0);

    const order = await pool.query(
      'INSERT INTO orders (user_id, status, total_amount) VALUES ($1, $2, $3) RETURNING order_id',
      [userId, 'pending', total]
    );
    const orderId = order.rows[0].order_id;

    for (const item of cart.rows) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    res.json({ orderId });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.send('E-commerce API is running');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});