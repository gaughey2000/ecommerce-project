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
  user: process.env.USER, // Your macOS username (e.g., connormcgaughey)
  host: 'localhost',
  database: 'ecommerce',
  password: '',
  port: 5432
});

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Failed to connect to the database:', err.stack);
    return;
  }
  console.log('Successfully connected to the ecommerce database');
  release(); // Release the client back to the pool
});

// Test endpoint to fetch products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).send('Server error');
  }
});

// Basic route
app.get('/', (req, res) => {
  res.send('E-commerce API is running');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});