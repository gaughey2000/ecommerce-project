const request = require('supertest');
const { app, pool } = require('../app'); // Adjust if your app export is elsewhere
const jwt = require('jsonwebtoken');

jest.setTimeout(15000);

const TEST_USER = {
  userId: 33, // Replace with a valid user_id from your DB
  role: 'user',
};

const TEST_TOKEN = jwt.sign(TEST_USER, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('Checkout Endpoint', () => {
  let testProductId;

  beforeAll(async () => {
    // Insert a product
    const productRes = await pool.query(
      `INSERT INTO products (name, description, price, stock_quantity)
       VALUES ('Test Product', 'For testing checkout', 10.99, 5)
       RETURNING product_id`
    );
    testProductId = productRes.rows[0].product_id;

    // Add to cart
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, 2)`,
      [TEST_USER.userId, testProductId]
    );
  });

  afterAll(async () => {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [TEST_USER.userId]);
    await pool.query('DELETE FROM order_items WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = $1)', [TEST_USER.userId]);
    await pool.query('DELETE FROM orders WHERE user_id = $1', [TEST_USER.userId]);
    await pool.query('DELETE FROM products WHERE product_id = $1', [testProductId]);
    await pool.end();
  });

  test('POST /api/checkout - should complete checkout successfully', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${TEST_TOKEN}`)
      .send({
        shipping_info: {
          name: 'John Doe',
          email: 'john@example.com',
          address: '123 Main St',
        },
        payment_info: {
          cardNumber: '4242424242424242',
          expiry: '12/25',
          cvv: '123',
        },
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('orderId');
    expect(res.body).toHaveProperty('total');
  });
});