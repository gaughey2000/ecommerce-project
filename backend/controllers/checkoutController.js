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
    const error = new Error('Missing shipping details');
    error.status = 400;
    return next(error);
  }

  // Validate payment info
  const { cardNumber, expiry, cvv } = payment_info || {};

  if (!cardNumber || !/^\d{16}$/.test(cardNumber)) {
    const error = new Error('Card number must be 16 digits');
    error.status = 400;
    return next(error);
  }

  if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
    const error = new Error('Expiry must be in MM/YY format');
    error.status = 400;
    return next(error);
  }

  if (!cvv || !/^\d{3}$/.test(cvv)) {
    const error = new Error('CVV must be 3 digits');
    error.status = 400;
    return next(error);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch cart
    const cartResult = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock_quantity, p.name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.user_id = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      const error = new Error('Cart is empty');
      error.status = 400;
      return next(error);
    }

    // 2. Validate stock levels and calculate total
    let total = 0;
    for (const item of cartResult.rows) {
      if (item.quantity > item.stock_quantity) {
        await client.query('ROLLBACK');
        const error = new Error(`Only ${item.stock_quantity} left in stock for "${item.name}"`);
        error.status = 400;
        return next(error);
      }
      total += item.quantity * parseFloat(item.price);
    }

    // 3. Simulate payment
    const paymentSuccess = true;
    if (!paymentSuccess) {
      await client.query('ROLLBACK');
      const error = new Error('Payment failed');
      error.status = 400;
      return next(error);
    }

    // 4. Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, status, total_amount, name, email, address)
       VALUES ($1, 'pending', $2, $3, $4, $5)
       RETURNING order_id`,
      [userId, total, shipping_info.name, shipping_info.email, shipping_info.address]
    );
    const orderId = orderResult.rows[0].order_id;

    // 5. Insert items and update stock
    for (const item of cartResult.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );

      await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 6. Clear cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    // 7. Commit transaction
    await client.query('COMMIT');
    return res.status(201).json({ orderId, total });

  } catch (err) {
    await client.query('ROLLBACK');
    if (err.message.includes('products_stock_quantity_check')) {
      const error = new Error('Cannot order more than available stock');
      error.status = 400;
      return next(error);
    }

    console.error('Checkout failed:', err);
    err.status = 500;
    return next(err);
  } finally {
    client.release();
  }
};

module.exports = { checkout };