require('dotenv').config({ path: './backend/.env' });
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, pool } = require('../app');

// Setup a known admin/test user
const TEST_USER_ID = 33; // must exist in DB
const token = jwt.sign({ userId: TEST_USER_ID, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

let createdOrderId;

beforeAll(async () => {
  // Ensure cart has a product
  const product = await pool.query(`SELECT product_id FROM products LIMIT 1`);
  const productId = product.rows[0].product_id;

  await pool.query(
    `INSERT INTO cart_items (user_id, product_id, quantity)
     VALUES ($1, $2, $3)`,
    [TEST_USER_ID, productId, 1]
  );
});

afterAll(async () => {
  if (createdOrderId) {
    await pool.query('DELETE FROM order_items WHERE order_id = $1', [createdOrderId]);
    await pool.query('DELETE FROM orders WHERE order_id = $1', [createdOrderId]);
  }
  await pool.end();
});

describe('Orders API', () => {
  test('POST /api/orders - should place a new order from cart', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test User',
        email: 'test@example.com',
        address: '123 Testing Lane'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('orderId');
    createdOrderId = res.body.orderId;
  });

  test('GET /api/orders - should return order history', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('order_id');
  });

  test('GET /api/orders/:orderId - should return order details', async () => {
    const res = await request(app)
      .get(`/api/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('order_id', createdOrderId);
  });

  test('GET /api/orders/:orderId/items - should return items for order', async () => {
    const res = await request(app)
      .get(`/api/orders/${createdOrderId}/items`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('product_id');
  });
});