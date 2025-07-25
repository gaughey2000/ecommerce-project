require('dotenv').config({ path: './backend/.env' }); 

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, pool } = require('../app');


const ADMIN_TOKEN = jwt.sign(
  { userId: 33, role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

jest.setTimeout(15000); 

let createdProductId;

describe('Product Routes', () => {
    afterAll(async () => {
        try {
          if (createdProductId) {
            await pool.query('DELETE FROM products WHERE product_id = $1', [createdProductId]);
            console.log(`🧼 Cleaned up product ${createdProductId}`);
          }
        } catch (err) {
          console.error('Cleanup error:', err);
        } finally {
          // Ensure the DB pool exits cleanly
          await new Promise((res) => setTimeout(res, 500)); // Let DB settle
          await pool.end();
        }
      });
  test('SMOKE: GET /api/products - should return 200', async () => {
    const res = await request(app).get('/api/products');
    console.log('🧪 Smoke test status:', res.statusCode);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/products - should return list of products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/products - should create a product (admin only)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .set('Content-Type', 'application/json')
      .send({
        name: 'Test Product',
        price: 9.99,
        description: 'For testing purposes',
        stock_quantity: 10
      });

    console.log('🔍 POST response:', res.statusCode, res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Test Product');

    createdProductId = res.body.id;
  });

  test('PATCH /api/products/:id - should update product info', async () => {
    const res = await request(app)
      .patch(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .set('Content-Type', 'application/json')
      .send({
        name: 'Updated Product',
        price: 19.99,
        description: 'Updated description',
        stock_quantity: 5
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Updated Product');
  });

  test('DELETE /api/products/:id - should soft delete product', async () => {
    const res = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('POST /api/products - should fail with missing required fields', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .set('Content-Type', 'application/json')
      .send({});

    console.log('⚠️ Missing fields response:', res.statusCode, res.body);
    expect(res.statusCode).toBe(400);
    expect(res.body.errors || res.body.message).toBeDefined();
  });

  test('POST /api/products - should fail with invalid price', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .set('Content-Type', 'application/json')
      .send({
        name: 'Invalid Price Product',
        price: -10,
        description: 'Invalid price',
        stock_quantity: 5
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors || res.body.message).toBeDefined();
  });

  test('PATCH /api/products/:id - should return 404 for non-existent product', async () => {
    const res = await request(app)
      .patch('/api/products/9999999')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .set('Content-Type', 'application/json')
      .send({
        name: 'Non-existent',
        price: 10,
        description: 'Ghost',
        stock_quantity: 0
      });

    expect(res.statusCode).toBe(404);
  });

  test('DELETE /api/products/:id - should return 404 for non-existent product', async () => {
    const res = await request(app)
      .delete('/api/products/9999999')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.statusCode).toBe(404);
  });

  test('POST /api/products - should return 401 without token', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Content-Type', 'application/json')
      .send({
        name: 'No Token Product',
        price: 9.99,
        description: 'No auth',
        stock_quantity: 5
      });

    expect(res.statusCode).toBe(401);
  });
});
