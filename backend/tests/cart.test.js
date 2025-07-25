const request = require('supertest');
const { app, pool } = require('../app');

jest.setTimeout(10000);

const unique = Date.now();
const TEST_USER = {
  email: `cart_${unique}@example.com`,
  username: `cartuser_${unique}`,
  password: 'Test1234!'
};

let token;
let userId;
let cartItemId;
let productId;

beforeAll(async () => {
  // Create product
  const productRes = await pool.query(
    `INSERT INTO products (name, description, price, stock_quantity)
     VALUES ('Test Cart Product', 'For cart testing', 5.00, 20)
     RETURNING product_id`
  );
  productId = productRes.rows[0].product_id;

  // Register and login test user
  await request(app).post('/api/auth/register').send(TEST_USER);
  const login = await request(app).post('/api/auth/login').send({
    email: TEST_USER.email,
    password: TEST_USER.password
  });

  token = login.body.token;
  userId = login.body.userId;
});

afterAll(async () => {
  await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM products WHERE product_id = $1', [productId]);
  await pool.end();
});

describe('🛒 Cart API', () => {
  test('POST /api/cart - Add to cart', async () => {
    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 2 });

    expect(res.statusCode).toBe(201);
    expect(res.body.product_id).toBe(productId);
    cartItemId = res.body.cart_item_id;
  });

  test('GET /api/cart - Get cart contents', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('PATCH /api/cart/:cartItemId - Update cart item quantity', async () => {
    const res = await request(app)
      .patch(`/api/cart/${cartItemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 5 });

    expect(res.statusCode).toBe(200);
    expect(res.body.quantity).toBe(5);
  });

  test('DELETE /api/cart/:cartItemId - Remove item from cart', async () => {
    const res = await request(app)
      .delete(`/api/cart/${cartItemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(204);
  });

  test('DELETE /api/cart/user/:userId - Clear cart', async () => {
    // Add again first
    await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId, quantity: 1 });

    const res = await request(app)
      .delete(`/api/cart/user/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(204);
  });
});