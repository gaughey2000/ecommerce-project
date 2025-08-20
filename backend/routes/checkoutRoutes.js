// backend/routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const checkout = require('../controllers/checkoutController');

// Create Stripe Checkout Session
router.post('/create-checkout-session', authenticate, checkout.createCheckoutSession);

// Stripe webhook (no auth; Stripe calls this)
// NOTE: app.js must mount this route with express.raw() (see below)
router.post('/webhook', checkout.handleWebhook);

module.exports = router;