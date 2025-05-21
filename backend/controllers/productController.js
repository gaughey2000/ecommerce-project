const pool = require('../db');

const getProducts = async (req, res) => {
  try {
    const { query } = req.query;
    let result;
    if (query) {
      result = await pool.query(
        'SELECT * FROM products WHERE name ILIKE $1',
        [`%${query}%`]
      );
    } else {
      result = await pool.query('SELECT * FROM products');
    }
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { image } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET image = $1 WHERE product_id = $2 RETURNING *',
      [image, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: err.message });
  }
};

const addProduct = async (req, res) => {
  const { name, price, description, stock_quantity, image } = req.body;
  try {
    if (!name || !price || !stock_quantity) {
      return res.status(400).json({ error: 'Name, price, and stock quantity are required' });
    }
    if (price <= 0 || stock_quantity < 0) {
      return res.status(400).json({ error: 'Price must be positive, stock quantity non-negative' });
    }

    const result = await pool.query(
      'INSERT INTO products (name, price, description, stock_quantity, image) VALUES ($1, $2, $3, $4, $5) RETURNING product_id, name, price, description, stock_quantity, image',
      [name, price, description || null, stock_quantity, image || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add product error:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = { getProducts, updateProduct, addProduct };