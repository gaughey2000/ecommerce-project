const { body } = require('express-validator');

exports.registerValidation = [
  body('email')
    .isEmail().withMessage('Email must be valid')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('name')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
];

exports.loginValidation = [
  body('email')
    .isEmail().withMessage('Valid email is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
];
