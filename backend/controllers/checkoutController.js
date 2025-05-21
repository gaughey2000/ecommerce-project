const pool = require('../db');

   const checkout = async (req, res) => {
     const { cart_items } = req.body;
     const userId = req.user.userId;
     try {
       if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
         return res.status(400).json({ error: 'Cart is empty or invalid' });
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
         'INSERT INTO orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING order_id',
         [userId, total, 'pending']
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

       res.json({ orderId, total, status: 'pending' });
     } catch (error) {
       console.error('Checkout error:', error);
       res.status(500).json({ error: error.message });
     }
   };

   module.exports = { checkout };