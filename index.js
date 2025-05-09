const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with a secure key in production

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

// Register user
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  console.log('Register request:', { email });
  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING user_id, email',
      [email, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '1h' });
    console.log('User registered:', user);
    res.json({ token, userId: user.user_id, email: user.email });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login user
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login request:', { email });
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0 || !result.rows[0].password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.user_id }, JWT_SECRET, { expiresIn: '1h' });
    console.log('User logged in:', user.user_id);
    res.json({ token, userId: user.user_id, email: user.email });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

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
app.post('/api/cart', authenticateToken, async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user.userId;
  console.log('Cart request:', { userId, productId, quantity });
  try {
    // Check stock quantity
    const product = await pool.query(
      'SELECT stock_quantity FROM products WHERE product_id = $1',
      [productId]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const stock = product.rows[0].stock_quantity;

    // Get current quantity in cart for this user and product
    const existingItem = await pool.query(
      'SELECT quantity FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    const currentQuantity = existingItem.rows.length > 0 ? existingItem.rows[0].quantity : 0;
    const newTotalQuantity = currentQuantity + quantity;

    if (newTotalQuantity > stock) {
      return res.status(400).json({ error: `Insufficient stock. Only ${stock} available.` });
    }

    if (existingItem.rows.length > 0) {
      // Update existing item's quantity
      const result = await pool.query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE user_id = $2 AND product_id = $3 RETURNING *',
        [quantity, userId, productId]
      );
      console.log('Cart item updated:', result.rows[0]);
      res.json(result.rows[0]);
    } else {
      // Insert new item
      const result = await pool.query(
        'INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
        [userId, productId, quantity]
      );
      console.log('Cart item inserted:', result.rows[0]);
      res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Cart error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update cart quantity
app.patch('/api/cart/:cartItemId', authenticateToken, async (req, res) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.userId;
  console.log('Update cart request:', { cartItemId, quantity });
  try {
    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }
    // Get product_id and stock_quantity
    const item = await pool.query(
      'SELECT product_id FROM cart_items WHERE cart_item_id = $1 AND user_id = $2',
      [cartItemId, userId]
    );
    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    const productId = item.rows[0].product_id;

    const product = await pool.query(
      'SELECT stock_quantity FROM products WHERE product_id = $1',
      [productId]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const stock = product.rows[0].stock_quantity;

    if (quantity > stock) {
      return res.status(400).json({ error: `Insufficient stock. Only ${stock} available.` });
    }

    const result = await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND user_id = $3 RETURNING *',
      [quantity, cartItemId, userId]
    );
    console.log('Cart item updated:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove from cart
app.delete('/api/cart/:cartItemId', authenticateToken, async (req, res) => {
  const { cartItemId } = req.params;
  const userId = req.user.userId;
  console.log('Remove cart item request:', { cartItemId });
  try {
    const result = await pool.query(
      'DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2 RETURNING *',
      [cartItemId, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    console.log('Cart item deleted:', result.rows[0]);
    res.status(204).send();
  } catch (err) {
    console.error('Remove cart error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Clear cart for user
app.delete('/api/cart/user/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  if (parseInt(userId) !== req.user.userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  console.log('Clear cart request:', { userId });
  try {
    const result = await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1 RETURNING *',
      [userId]
    );
    console.log('Cart cleared:', result.rows);
    res.status(204).send();
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
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