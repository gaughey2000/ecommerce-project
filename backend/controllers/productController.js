const pool = require('../db');

// Fetch all products or search by query
const getProducts = async (req, res) => {
  const { query } = req.query;
  try {
    let sql, params;
    if (query) {
      sql = `SELECT
               product_id AS id,
               name,
               price,
               description,
               stock_quantity,
               image
             FROM products
             WHERE name ILIKE $1 OR description ILIKE $1`;
      params = [`%${query}%`];
    } else {
      sql = `SELECT
               product_id AS id,
               name,
               price,
               description,
               stock_quantity,
               image
             FROM products`;
      params = [];
    }
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error.stack);
    res.status(500).json({ error: 'Failed to fetch products', details: error.message });
  }
};

// Add a new product
const addProduct = async (req, res) => {
  const { name, price, description, stock_quantity, image } = req.body;
  if (!name || price == null || stock_quantity == null) {
    return res.status(400).json({ error: 'Name, price, and stock quantity are required' });
  }
  if (price <= 0 || stock_quantity < 0) {
    return res.status(400).json({ error: 'Price must be positive, stock quantity non-negative' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO products (name, price, description, stock_quantity, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
         product_id AS id,
         name,
         price,
         description,
         stock_quantity,
         image`,
      [name, price, description || null, stock_quantity, image || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add product error:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

// Update an existing product
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, stock_quantity, image } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1,
           price = $2,
           description = $3,
           stock_quantity = $4,
           image = $5
       WHERE product_id = $6
       RETURNING
         product_id AS id,
         name,
         price,
         description,
         stock_quantity,
         image`,
      [name, price, description, stock_quantity, image, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update product error:', err.stack);
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
};

// Fetch a single product by ID
const getProductById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }
  try {
    const result = await pool.query(
      `SELECT
         product_id AS id,
         name,
         price,
         description,
         stock_quantity,
         image
       FROM products
       WHERE product_id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get product by ID error:', err.stack);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }
  try {
    const result = await pool.query(
      'DELETE FROM products WHERE product_id = $1 RETURNING product_id AS id',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted', id: result.rows[0].id });
  } catch (error) {
    console.error('Delete product error:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = { getProducts, addProduct, updateProduct, getProductById, deleteProduct };