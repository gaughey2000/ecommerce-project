// backend/routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createCheckoutSession } = require('../controllers/checkoutController');

router.post('/create-checkout-session', auth, createCheckoutSession);

module.exports = router;