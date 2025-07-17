console.log('⚙️ Mounting POST /api/checkout');
const { checkoutValidation } = require('../middleware/validation/checkoutValidation');
const { validate } = require('../middleware/validation/validate');
const express = require('express');
const { checkout } = require('../controllers/checkoutController');
const authenticateToken = require('../middleware/auth');
const router = express.Router();


router.post('/', authenticateToken, checkoutValidation, validate, checkout);

module.exports = router;