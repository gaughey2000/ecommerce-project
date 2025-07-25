const request = require('supertest');
const { app, pool } = require('../app');

jest.setTimeout(10000); // 10 seconds

const uniqueSuffix = Date.now(); // ensure unique test user
const TEST_USER = {
  email: `test_${uniqueSuffix}@example.com`,
  username: `testuser_${uniqueSuffix}`,
  password: 'TestPass123'
};

let token;
let userId;

describe('Auth Routes', () => {
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

    token = res.body.token;
    userId = res.body.userId;
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

  test('GET /api/auth/me - should return current user info', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(TEST_USER.email);
    expect(res.body.username).toBe(TEST_USER.username);
  });

  test('POST /api/auth/change-password - should update password', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        current: TEST_USER.password,
        new: 'NewPass456!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/password updated/i);
  });
});