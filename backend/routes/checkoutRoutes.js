const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createCheckoutSession, handleWebhook } = require('../controllers/checkoutController');

router.post('/create-checkout-session', auth, createCheckoutSession);
router.post('/webhook', handleWebhook);

module.exports = router;