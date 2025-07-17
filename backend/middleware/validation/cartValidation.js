const { body } = require('express-validator');

exports.addToCartValidation = [
  body('productId').isInt({ gt: 0 }).withMessage('Valid product ID is required'),
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be at least 1')
];

exports.updateCartValidation = [
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be at least 1')
];