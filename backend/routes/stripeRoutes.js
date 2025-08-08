// backend/routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');

router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const line_items = cartItems.map((item) => {
      const product_data = { name: String(item.name || '').trim() };
      const desc = (item.description ?? '').toString().trim();
      if (desc) product_data.description = desc; // ✅ only add if non-empty

      return {
        price_data: {
          currency: 'gbp',
          product_data,
          unit_amount: Math.round(Number(item.price) * 100), // in pence
        },
        quantity: Number(item.quantity) || 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${process.env.CORS_ORIGIN}/order-success`,
      cancel_url: `${process.env.CORS_ORIGIN}/cart`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session error:', err);
    return res.status(500).json({ error: 'Failed to create Stripe session' });
  }
});

module.exports = router;