const { body } = require('express-validator');

exports.registerValidation = [
  body('username')
    .trim()
    .escape()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 2 }).withMessage('Username must be at least 2 characters'),
  body('email')
    .isEmail().withMessage('Email must be valid')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/\d/).withMessage('Password must contain a number')
];

exports.loginValidation = [
  body('email')
    .isEmail().withMessage('Email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];