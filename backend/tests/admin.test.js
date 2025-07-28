require('dotenv').config({ path: './backend/.env' });
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, pool } = require('../app');

jest.setTimeout(10000);

const ADMIN_TOKEN = jwt.sign(
  { userId: 33, role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const TEMP_USER = {
  email: `temp_${Date.now()}@example.com`,
  username: `tempuser_${Date.now()}`,
  password: 'TempPass123'
};

let tempUserId;

describe('Admin Routes', () => {
  afterAll(async () => {
    if (tempUserId) {
      await pool.query('DELETE FROM users WHERE user_id = $1', [tempUserId]);
    }
    await pool.end();
  });

  test('GET /api/auth/users - should return all users (admin only)', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('DELETE /api/auth/users/:userId - should delete a user (admin only)', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(TEMP_USER);

    tempUserId = registerRes.body.userId;

    const deleteRes = await request(app)
      .delete(`/api/auth/users/${tempUserId}`)
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.message).toMatch(/deleted/i);
  });

  test('DELETE /api/auth/users/:userId - should block self-deletion', async () => {
    const res = await request(app)
      .delete('/api/auth/users/33') // admin deleting self
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/cannot delete your own/i);
  });
});