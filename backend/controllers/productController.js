const pool = require('../db');

// ---- helpers ----

// map legacy price <-> unit_amount
const toUnitAmount = (price) => Math.round(Number(price) * 100);
const toPrice = (unit_amount) => Number(unit_amount) / 100;

// Normalize incoming numeric-ish values from forms/JSON
const normPrice = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return Number.isFinite(v) ? Number(v) : null;
};

const normInt = (v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isInteger(n) ? n : null;
  }
  return Number.isInteger(v) ? v : null;
};

// GET /products?query=...
const getProducts = async (req, res, next) => {
  const { query } = req.query;
  try {
    // Return both unit_amount/currency and keep price for backward compatibility
    const sql = query
      ? `SELECT product_id AS id, name, description, stock_quantity, image,
                COALESCE(unit_amount, ROUND(price * 100)) AS unit_amount,
                COALESCE(currency, 'GBP') AS currency,
                COALESCE(price, COALESCE(unit_amount,0)/100.0) AS price
         FROM products
         WHERE is_active = true AND (name ILIKE $1 OR description ILIKE $1)`
      : `SELECT product_id AS id, name, description, stock_quantity, image,
                COALESCE(unit_amount, ROUND(price * 100)) AS unit_amount,
                COALESCE(currency, 'GBP') AS currency,
                COALESCE(price, COALESCE(unit_amount,0)/100.0) AS price
         FROM products
         WHERE is_active = true`;

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
  try {
    const { name, unit_amount, currency, price, description, stock_quantity, image } = req.body;

    const uaInput = normInt(unit_amount);
    const priceInput = normPrice(price);
    const stockInt = normInt(stock_quantity);

    if (!name || (uaInput == null && priceInput == null) || stockInt == null) {
      const error = new Error('Name, unit_amount/price, and stock quantity are required');
      error.status = 400;
      return next(error);
    }

    const ua = uaInput != null ? uaInput : toUnitAmount(priceInput);
    if (!Number.isInteger(ua) || ua <= 0) {
      const error = new Error('unit_amount must be a positive integer (minor units)');
      error.status = 400;
      return next(error);
    }

    const curr = (currency || 'GBP').toUpperCase();

    const result = await pool.query(
      `INSERT INTO products (name, description, unit_amount, currency, price, stock_quantity, image, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING product_id AS id, name, description, stock_quantity, image,
                 unit_amount, currency,
                 COALESCE(price, unit_amount/100.0) AS price`,
      [name, description || null, ua, curr, priceInput ?? null, stockInt, image || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    error.status = error.status || 500;
    next(error);
  }
};

// PATCH /products/:id
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, unit_amount, currency, price, description, stock_quantity, image } = req.body;

    const uaInput = normInt(unit_amount);
    const priceInput = normPrice(price);
    const stockInt = normInt(stock_quantity);

    if (!name || (uaInput == null && priceInput == null) || stockInt == null) {
      const error = new Error('All fields are required');
      error.status = 400;
      return next(error);
    }

    const ua = uaInput != null ? uaInput : toUnitAmount(priceInput);
    if (!Number.isInteger(ua) || ua <= 0) {
      const error = new Error('unit_amount must be a positive integer (minor units)');
      error.status = 400;
      return next(error);
    }

    const curr = (currency || 'GBP').toUpperCase();

    const result = await pool.query(
      `UPDATE products
       SET name = $1, description = $2, unit_amount = $3, currency = $4, price = $5,
           stock_quantity = $6, image = $7
       WHERE product_id = $8 AND is_active = true
       RETURNING product_id AS id, name, description, stock_quantity, image,
                 unit_amount, currency,
                 COALESCE(price, unit_amount/100.0) AS price`,
      [name, description || null, ua, curr, priceInput ?? null, stockInt, image || null, id]
    );

    if (result.rows.length === 0) {
      const error = new Error('Product not found or is archived');
      error.status = 404;
      return next(error);
    }

    res.json(result.rows[0]);
  } catch (error) {
    error.status = error.status || 500;
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
      `SELECT product_id AS id, name, description, stock_quantity, image,
              COALESCE(unit_amount, ROUND(price * 100)) AS unit_amount,
              COALESCE(currency, 'GBP') AS currency,
              COALESCE(price, COALESCE(unit_amount,0)/100.0) AS price
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

module.exports = { getProducts, addProduct, updateProduct, getProductById, deleteProduct };