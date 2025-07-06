const pool = require('../db');

// Controller to handle checkout
const checkout = async (req, res, next) => {
  const userId = req.user.userId;
  const { shipping_info, payment_info } = req.body;

  // Basic validation
  if (!shipping_info?.name || !shipping_info?.email || !shipping_info?.address) {
    return res.status(400).json({ error: 'Missing shipping details' });
  }

  if (
    !payment_info?.cardNumber ||
    !payment_info?.expiry ||
    !payment_info?.cvv
  ) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  try {
    // 1. Get cart items
    const cartResult = await pool.query(
      `SELECT ci.product_id, ci.quantity, p.price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // 2. Calculate total
    const total = cartResult.rows.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );

    // 3. Simulate payment processing
    const paymentSuccess = true;
    if (!paymentSuccess) {
      return res.status(400).json({ error: 'Payment failed' });
    }

    // 4. Create order
    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, status, total_amount, name, email, address)
       VALUES ($1, 'pending', $2, $3, $4, $5)
       RETURNING order_id`,
      [userId, total, shipping_info.name, shipping_info.email, shipping_info.address]
    );
    const orderId = orderResult.rows[0].order_id;

    // 5. Insert order items and update stock
    const insertItemSQL = `
      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES ($1, $2, $3, $4)
    `;
    for (const item of cartResult.rows) {
      await pool.query(insertItemSQL, [
        orderId,
        item.product_id,
        item.quantity,
        item.price,
      ]);

      await pool.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 6. Clear cart
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    // 7. Respond with order
    return res.status(201).json({ orderId, total });
  } catch (err) {
    console.error('Checkout failed:', err);
    err.status = 500;
    next(err);
  }
};

module.exports = { checkout };