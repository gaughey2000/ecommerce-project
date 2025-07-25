const pool = require('../db');

// GET /products?query=...
const getProducts = async (req, res, next) => {
  const { query } = req.query;
  try {
    const sql = query
      ? `SELECT product_id AS id, name, price, description, stock_quantity, image
         FROM products
         WHERE is_active = true AND (name ILIKE $1 OR description ILIKE $1)`
      : `SELECT product_id AS id, name, price, description, stock_quantity, image FROM products WHERE is_active = true`;

    const params = query ? [`%${query}%`] : [];
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

// POST /products
const addProduct = async (req, res, next) => {
  const { name, price, description, stock_quantity, image } = req.body;

  if (!name || price == null || stock_quantity == null) {
    const error = new Error('Name, price, and stock quantity are required');
    error.status = 400;
    return next(error);
  }

  if (Number(price) <= 0) {
    const error = new Error('Price must be greater than 0');
    error.status = 400;
    return next(error);
  }

  if (Number(stock_quantity) < 0) {
    const error = new Error('Stock quantity cannot be negative');
    error.status = 400;
    return next(error);
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
    error.status = 500;
    next(error);
  }
};

// PATCH /products/:id
const updateProduct = async (req, res, next) => {
  const { id } = req.params;
  const { name, price, description, stock_quantity, image } = req.body;

  if (!name || price == null || stock_quantity == null) {
    const error = new Error('All fields are required');
    error.status = 400;
    return next(error);
  }

  if (Number(price) <= 0) {
    const error = new Error('Price must be greater than 0');
    error.status = 400;
    return next(error);
  }

  if (Number(stock_quantity) < 0) {
    const error = new Error('Stock quantity cannot be negative');
    error.status = 400;
    return next(error);
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1, price = $2, description = $3, stock_quantity = $4, image = $5
       WHERE product_id = $6 AND is_active = true
       RETURNING product_id AS id, name, price, description, stock_quantity, image`,
      [name, price, description || null, stock_quantity, image || null, id]
    );

    if (result.rows.length === 0) {
      const error = new Error('Product not found or is archived');
      error.status = 404;
      return next(error);
    }

    res.json(result.rows[0]);
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

// GET /products/:id
const getProductById = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid product ID');
    error.status = 400;
    return next(error);
  }

  try {
    const result = await pool.query(
      `SELECT product_id AS id, name, price, description, stock_quantity, image
       FROM products
       WHERE product_id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      const error = new Error('Product not found');
      error.status = 404;
      return next(error);
    }

    res.json(result.rows[0]);
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

// DELETE /products/:id (soft delete)
const deleteProduct = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    const error = new Error('Invalid product ID');
    error.status = 400;
    return next(error);
  }

  try {
    const result = await pool.query(
      'UPDATE products SET is_active = false WHERE product_id = $1 RETURNING product_id AS id',
      [id]
    );

    if (result.rowCount === 0) {
      const error = new Error('Product not found');
      error.status = 404;
      return next(error);
    }

    res.json({ message: 'Product archived (soft-deleted)', id: result.rows[0].id });
  } catch (error) {
    error.status = 500;
    next(error);
  }
};

module.exports = {
  getProducts,
  addProduct,
  updateProduct,
  getProductById,
  deleteProduct
};