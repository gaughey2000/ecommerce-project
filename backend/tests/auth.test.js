const request = require('supertest');
const { app, pool } = require('../index');

jest.setTimeout(10000); // 10 seconds

const uniqueSuffix = Date.now(); // ensure unique test user
const TEST_USER = {
  email: `test_${uniqueSuffix}@example.com`,
  username: `testuser_${uniqueSuffix}`,
  password: 'TestPass123'
};

describe('Auth Routes', () => {
  // Graceful teardown
  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE email = $1', [TEST_USER.email]);
  });

  test('POST /api/auth/register - should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(TEST_USER);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('userId');
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/auth/login - should login the user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: TEST_USER.email,
        password: TEST_USER.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe(TEST_USER.email);
  });
});