const express = require('express');
const router = express.Router();

const { getProducts, getProductById, addProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation/validate');

const productValidation = [
  body('name').trim().escape().notEmpty().withMessage('Product name is required'),
  body('description').optional().trim().escape().isLength({ min: 5 }).withMessage('Description must be at least 5 characters'),
  body('unit_amount')
    .optional()
    .isInt({ gt: 0 }).withMessage('unit_amount must be a positive integer (minor units)'),
  body('price') // legacy support during migration
    .optional()
    .isFloat({ gt: 0 }).withMessage('price must be a positive number'),
  body('currency')
    .optional()
    .isString().isLength({ min: 3, max: 3 }).withMessage('currency must be a 3-letter code'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Stock quantity must be 0 or greater')
];

// Public
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin
router.post('/', auth, requireRole('admin'), productValidation, validate, addProduct);
router.patch('/:id', auth, requireRole('admin'), productValidation, validate, updateProduct);
router.delete('/:id', auth, requireRole('admin'), deleteProduct);

module.exports = router;