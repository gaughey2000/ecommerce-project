const pool = require('../db');

// GET /products?query=...
const getProducts = async (req, res) => {
  const { query } = req.query;
  try {
    const sql = query
      ? `SELECT product_id AS id, name, price, description, stock_quantity, image
         FROM products
         WHERE name ILIKE $1 OR description ILIKE $1`
      : `SELECT product_id AS id, name, price, description, stock_quantity, image FROM products`;

    const params = query ? [`%${query}%`] : [];
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get products failed:', error.stack);
    res.status(500).json({ error: 'Could not retrieve products' });
  }
};

// POST /products
const addProduct = async (req, res) => {
  const { name, price, description, stock_quantity, image } = req.body;

  if (!name || price == null || stock_quantity == null) {
    return res.status(400).json({ error: 'Name, price, and stock quantity are required' });
  }

  if (Number(price) <= 0) {
    return res.status(400).json({ error: 'Price must be greater than 0' });
  }

  if (Number(stock_quantity) < 0) {
    return res.status(400).json({ error: 'Stock quantity cannot be negative' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO products (name, price, description, stock_quantity, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING product_id AS id, name, price, description, stock_quantity, image`,
      [name, price, description || null, stock_quantity, image || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add product failed:', error.stack);
    res.status(500).json({ error: 'Failed to add product' });
  }
};

// PATCH /products/:id
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, price, description, stock_quantity, image } = req.body;

  if (!name || price == null || stock_quantity == null) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (Number(price) <= 0) {
    return res.status(400).json({ error: 'Price must be greater than 0' });
  }

  if (Number(stock_quantity) < 0) {
    return res.status(400).json({ error: 'Stock quantity cannot be negative' });
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1, price = $2, description = $3, stock_quantity = $4, image = $5
       WHERE product_id = $6
       RETURNING product_id AS id, name, price, description, stock_quantity, image`,
      [name, price, description || null, stock_quantity, image || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product failed:', error.stack);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// GET /products/:id
const getProductById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    const result = await pool.query(
      `SELECT product_id AS id, name, price, description, stock_quantity, image
       FROM products
       WHERE product_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get product by ID failed:', error.stack);
    res.status(500).json({ error: 'Could not retrieve product' });
  }
};

// DELETE /products/:id
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
    console.error('Delete product failed:', error.stack);
    res.status(500).json({ error: 'Could not delete product' });
  }
};

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  getProductById,
  deleteProduct
};