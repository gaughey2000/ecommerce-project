const pool = require('../db');

const checkout = async (req, res) => {
  const { cart_items, shipping_info, payment_info } = req.body;
  const userId = req.user.userId;
  try {
    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty or invalid' });
    }
    if (!payment_info || !payment_info.cardNumber || !payment_info.expiry || !payment_info.cvv) {
      return res.status(400).json({ error: 'Payment information incomplete' });
    }

    // Mock payment processing
    const paymentResult = mockProcessPayment(payment_info);
    if (!paymentResult.success) {
      return res.status(400).json({ error: paymentResult.message });
    }

    let total = 0;
    for (const item of cart_items) {
      const product = await pool.query(
        'SELECT price, stock_quantity FROM products WHERE product_id = $1',
        [item.product_id]
      );
      if (product.rows.length === 0) {
        return res.status(404).json({ error: `Product ID ${item.product_id} not found` });
      }
      const { price, stock_quantity } = product.rows[0];
      if (item.quantity > stock_quantity) {
        return res.status(400).json({ error: `Insufficient stock for product ID ${item.product_id}` });
      }
      total += price * item.quantity;
    }

    const orderResult = await pool.query(
      'INSERT INTO orders (user_id, total_amount, status, shipping_address, shipping_city, shipping_postal_code, shipping_country) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING order_id',
      [userId, total, 'completed', shipping_info.address, shipping_info.city, shipping_info.postalCode, shipping_info.country]
    );
    const orderId = orderResult.rows[0].order_id;

    for (const item of cart_items) {
      const product = await pool.query(
        'SELECT price FROM products WHERE product_id = $1',
        [item.product_id]
      );
      const unitPrice = product.rows[0].price;

      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, unitPrice]
      );

      await pool.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }

    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    res.json({ orderId, total, status: 'completed' });
  } catch (error) {
    console.error('Checkout error:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const mockProcessPayment = (paymentInfo) => {
  const random = Math.random();
  if (random < 0.05) {
    return { success: false, message: 'Invalid payment details' };
  } else if (random < 0.20) {
    return { success: false, message: 'Payment declined' };
  }
  return { success: true, message: 'Payment accepted' };
};

module.exports = { checkout };