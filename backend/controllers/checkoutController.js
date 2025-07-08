const pool = require('../db');

const checkout = async (req, res, next) => {
  const userId = req.user.userId;
  const { shipping_info, payment_info } = req.body;

  // Validate shipping info
  if (
    !shipping_info?.name ||
    !shipping_info?.email ||
    !shipping_info?.address
  ) {
    return res.status(400).json({ error: 'Missing shipping details' });
  }

  // Validate payment info
  const { cardNumber, expiry, cvv } = payment_info || {};

  if (!cardNumber || !/^\d{16}$/.test(cardNumber)) {
    return res.status(400).json({ error: 'Card number must be 16 digits' });
  }

  if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
    return res.status(400).json({ error: 'Expiry must be in MM/YY format' });
  }

  if (!cvv || !/^\d{3}$/.test(cvv)) {
    return res.status(400).json({ error: 'CVV must be 3 digits' });
  }

  try {
    // 1. Fetch cart
    const cartResult = await pool.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock_quantity, p.name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // 2. Validate stock levels and calculate total
    let total = 0;
    for (const item of cartResult.rows) {
      if (item.quantity > item.stock_quantity) {
        return res.status(400).json({
          error: `Only ${item.stock_quantity} left in stock for "${item.name}"`
        });
      }
      total += item.quantity * parseFloat(item.price);
    }

    // 3. Simulate payment
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

    // 5. Insert items and update stock
    for (const item of cartResult.rows) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      await pool.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 6. Clear cart
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    // 7. Respond
    return res.status(201).json({ orderId, total });

  } catch (err) {
    if (err.message.includes('products_stock_quantity_check')) {
      return res.status(400).json({ error: 'Cannot order more than available stock' });
    }

    console.error('Checkout failed:', err);
    res.status(500).json({ error: 'Something went wrong during checkout' });
  }
};

module.exports = { checkout };