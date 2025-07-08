const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation/validate'); // Ensure validation middleware is applied

// Validation middleware for products
const productValidation = [
  body('name')
    .trim()
    .escape()
    .notEmpty().withMessage('Product name is required'),
  body('description')
    .trim()
    .escape()
    .isLength({ min: 5 }).withMessage('Description must be at least 5 characters'),
  body('price')
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('stock_quantity')
    .isInt({ min: 0 }).withMessage('Stock quantity must be 0 or greater')
];

router.get('/', (req, res, next) => {
  console.log('Handling GET /api/products');
  next();
}, getProducts);

router.get('/:id', getProductById);

// Admin routes with validation
router.post('/', auth, requireRole('admin'), productValidation, validate, addProduct);
router.put('/:id', auth, requireRole('admin'), productValidation, validate, updateProduct);
router.delete('/:id', auth, requireRole('admin'), deleteProduct);

module.exports = router;