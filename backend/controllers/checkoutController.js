const pool = require('../db');

// Controller to handle checkout: create an order from the user's cart and process payment
const checkout = async (req, res) => {
  const userId = req.user.userId;
  const { shipping_info, payment_info } = req.body;

  // Validate shipping information
  if (!shipping_info || !shipping_info.name || !shipping_info.email || !shipping_info.address) {
    return res.status(400).json({
      error: 'Incomplete shipping information: name, email, and address required'
    });
  }

  // Validate payment information
  if (!payment_info || !payment_info.cardNumber || !payment_info.expiry || !payment_info.cvv) {
    return res.status(400).json({
      error: 'Incomplete payment information: cardNumber, expiry, and cvv required'
    });
  }

  try {
    // 1. Fetch cart items for this user
    const cartQuery = `
      SELECT ci.product_id, ci.quantity, p.price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      WHERE ci.user_id = $1
    `;
    const cartResult = await pool.query(cartQuery, [userId]);

    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // 2. Calculate total amount
    let total = 0;
    cartResult.rows.forEach(item => {
      total += parseFloat(item.price) * item.quantity;
    });

    // 3. Simulate/mock payment processing
    // (Replace with real payment gateway integration as needed)
    const paymentSuccess = true;
    if (!paymentSuccess) {
      return res.status(400).json({ error: 'Payment processing failed' });
    }

    // 4. Create order record
    const insertOrderSQL = `
      INSERT INTO orders (user_id, status, total_amount, name, email, address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING order_id
    `;
    const orderResult = await pool.query(insertOrderSQL, [
      userId,
      'completed',
      total,
      shipping_info.name,
      shipping_info.email,
      shipping_info.address
    ]);
    const orderId = orderResult.rows[0].order_id;

    // 5. Insert each cart item into order_items and update stock
    const insertItemSQL = `
      INSERT INTO order_items (order_id, product_id, quantity, unit_price)
      VALUES ($1, $2, $3, $4)
    `;
    for (const item of cartResult.rows) {
      await pool.query(insertItemSQL, [
        orderId,
        item.product_id,
        item.quantity,
        item.price
      ]);

      // Deduct stock
      await pool.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }

    // 6. Clear the user's cart
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    // 7. Respond with the new order ID and total
    return res.status(201).json({ orderId, total });
  } catch (error) {
    console.error('Checkout error:', error.stack);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = { checkout };