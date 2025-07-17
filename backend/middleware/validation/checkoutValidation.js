const { body } = require('express-validator');

exports.checkoutValidation = [
  body('shipping_info.name').trim().notEmpty().withMessage('Name is required'),
  body('shipping_info.email').isEmail().withMessage('Valid email is required'),
  body('shipping_info.address').trim().notEmpty().withMessage('Address is required'),
  body('payment_info.cardNumber')
    .matches(/^\d{16}$/).withMessage('Card number must be 16 digits'),
  body('payment_info.expiry')
    .matches(/^\d{2}\/\d{2}$/).withMessage('Expiry must be MM/YY'),
  body('payment_info.cvv')
    .matches(/^\d{3}$/).withMessage('CVV must be 3 digits')
];