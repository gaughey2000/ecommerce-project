// backend/controllers/checkoutController.js
const pool = require('../db');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Helpers
const toPrice = (unit) => Number(unit) / 100; // minor units -> decimal

exports.createCheckoutSession = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Snapshot the user's cart with minor units + currency
    const { rows: cart } = await pool.query(
      `SELECT ci.product_id, ci.quantity,
              p.name,
              COALESCE(p.unit_amount, ROUND(p.price * 100)) AS unit_amount,
              COALESCE(p.currency, 'GBP') AS currency,
              COALESCE(p.description, '') AS description
       FROM cart_items ci
       JOIN products p ON p.product_id = ci.product_id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cart.length === 0) {
      return res.status(400).json({ code: 'CART_EMPTY', message: 'Cart is empty' });
    }

    const totalMinor = cart.reduce((s, it) => s + it.quantity * it.unit_amount, 0);

    // 1) Create a pending order + items (webhook will mark it paid)
    const { rows: orderIns } = await pool.query(
      `INSERT INTO orders (user_id, status, total_amount)
       VALUES ($1, 'pending', $2)
       RETURNING order_id`,
      [userId, toPrice(totalMinor)]
    );
    const orderId = orderIns[0].order_id;

    for (const it of cart) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, it.product_id, it.quantity, toPrice(it.unit_amount)]
      );
    }

    // 2) Stripe line items
    const line_items = cart.map((it) => ({
      price_data: {
        currency: it.currency.toLowerCase(),
        product_data: {
          name: it.name,
          description: it.description || undefined,
        },
        unit_amount: it.unit_amount, // minor units
      },
      quantity: it.quantity,
    }));

    const FRONTEND_URL =
      process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      client_reference_id: String(userId),
      metadata: {
        userId: String(userId),
        orderId: String(orderId),
      },
      success_url: `${FRONTEND_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/cart`,
    });

    // Link the pending order to this session
    await pool.query(
      `UPDATE orders SET stripe_session_id = $1 WHERE order_id = $2`,
      [session.id, orderId]
    );

    return res.json({ url: session.url });
  } catch (err) {
    console.error('❌ createCheckoutSession error:', err);
    return res
      .status(500)
      .json({ code: 'STRIPE_SESSION_ERR', message: 'Failed to create Stripe session' });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).send('Webhook misconfigured');

  // Support either raw buffer (recommended) or plain body buffer
  const rawBody =
    req.rawBody ||
    (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body)));

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // --- helpers ---
  const savePaid = async ({ session, paymentIntentId }) => {
    const sessionId = session?.id || null;
    const name = session?.customer_details?.name || null;
    const email = session?.customer_details?.email || null;
    const address = session?.customer_details?.address
      ? JSON.stringify(session.customer_details.address)
      : null;
    const orderIdMeta = Number(session?.metadata?.orderId) || null;
    const userIdMeta = Number(session?.metadata?.userId) || null;

    // Primary update by session id
    if (sessionId) {
      const { rowCount } = await pool.query(
        `UPDATE orders
           SET status = 'paid',
               stripe_payment_intent = $1,
               name    = COALESCE($2, name),
               email   = COALESCE($3, email),
               address = COALESCE($4, address)
         WHERE stripe_session_id = $5
           AND status = 'pending'`,
        [paymentIntentId || session.payment_intent || null, name, email, address, sessionId]
      );
      if (rowCount > 0) {
        if (userIdMeta) {
          try {
            await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userIdMeta]);
          } catch (e) {
            console.error('⚠️ Failed to clear cart after payment:', e);
          }
        }
        return true;
      }
    }

    // Fallback update by order id
    if (orderIdMeta) {
      const { rowCount } = await pool.query(
        `UPDATE orders
           SET status = 'paid',
               stripe_session_id = COALESCE($1, stripe_session_id),
               stripe_payment_intent = COALESCE($2, stripe_payment_intent),
               name    = COALESCE($3, name),
               email   = COALESCE($4, email),
               address = COALESCE($5, address)
         WHERE order_id = $6
           AND status = 'pending'`,
        [sessionId, paymentIntentId || session?.payment_intent || null, name, email, address, orderIdMeta]
      );
      if (rowCount > 0) {
        if (userIdMeta) {
          try {
            await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userIdMeta]);
          } catch (e) {
            console.error('⚠️ Failed to clear cart after payment:', e);
          }
        }
        return true;
      }
    }

    return false;
  };

  const loadSessionByPaymentIntent = async (paymentIntentId) => {
    if (!paymentIntentId) return null;
    const list = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 });
    return list.data?.[0] || null;
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await savePaid({ session, paymentIntentId: session.payment_intent });
        break;
      }
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        const session = await loadSessionByPaymentIntent(pi.id);
        if (session) {
          await savePaid({ session, paymentIntentId: pi.id });
        } else {
          console.warn(`⚠️ PI ${pi.id} succeeded but no Checkout Session found.`);
        }
        break;
      }
      case 'charge.succeeded':
      case 'charge.updated': {
        const charge = event.data.object;
        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;

        const session = await loadSessionByPaymentIntent(paymentIntentId);
        if (session) {
          if (!session.customer_details && charge.billing_details) {
            session.customer_details = {
              name: charge.billing_details.name || null,
              email: charge.billing_details.email || null,
              address: charge.billing_details.address || null,
            };
          }
          await savePaid({ session, paymentIntentId });
        } else {
          console.warn(`⚠️ Charge event for PI ${paymentIntentId} but no Checkout Session found.`);
        }
        break;
      }
      default:
        // Ignore other events
        break;
    }

    return res.status(200).send('ok');
  } catch (err) {
    console.error('❌ Webhook handler error:', err);
    return res.status(500).send('Webhook handler failure');
  }
};