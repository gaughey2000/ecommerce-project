// backend/controllers/checkoutController.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (req, res) => {
  const { cartItems, success_url, cancel_url } = req.body || {};
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ code: 'CART_EMPTY', message: 'Cart is empty' });
  }

  try {
    const line_items = cartItems.map((item) => {
      // Supports { price_id, quantity }
      if (item.price_id) {
        return { price: String(item.price_id), quantity: Number(item.quantity) || 1 };
      }

      // Supports { name, unit_amount, currency, quantity, description? }
      const name = String(item.name || '').trim();
      const currency = (item.currency || 'GBP').toString().toLowerCase();
      const unit_amount = Number.isInteger(item.unit_amount)
        ? item.unit_amount
        : Math.round(Number(item.price) * 100); // legacy fallback

      if (!name || !unit_amount) {
        throw new Error('Invalid line item: name and unit_amount required');
      }

      const product_data = { name };
      if (item.description) product_data.description = String(item.description);

      return {
        price_data: { currency, product_data, unit_amount },
        quantity: Number(item.quantity) || 1,
      };
    });

    const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: success_url || `${FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${FRONTEND_URL}/cart`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe session error:', err);
    return res.status(500).json({ code: 'STRIPE_SESSION_ERR', message: 'Failed to create Stripe session' });
  }
};