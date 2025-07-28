const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { app } = require('../app');
const jwt = require('jsonwebtoken');

// 🔐 Simulate admin token (adjust userId to match your DB if needed)
const ADMIN_TOKEN = jwt.sign(
  { userId: 33, role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

describe('📸 Image Upload Endpoint', () => {
  test('POST /api/uploads/products/image - valid image upload', async () => {
    const imagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    const res = await request(app)
      .post('/api/uploads/products/image')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .attach('image', imagePath);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('image');
    expect(res.body.image).toMatch(/\/uploads\//);
  });

  test('POST /api/uploads/products/image - invalid file type', async () => {
    const invalidPath = path.join(__dirname, 'fixtures', 'test-invalid.txt');
    const res = await request(app)
      .post('/api/uploads/products/image')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .attach('image', invalidPath);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Only image files are allowed/);
  });

  test('POST /api/uploads/products/image - file too large', async () => {
    const largePath = path.join(__dirname, 'fixtures', 'large.jpg'); // >2MB
    const res = await request(app)
      .post('/api/uploads/products/image')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .attach('image', largePath);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/File too large/);
  });

  test('POST /api/uploads/products/image - missing file', async () => {
    const res = await request(app)
      .post('/api/uploads/products/image')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/No image file received/);
  });
});

afterAll(() => {
    pool.end();
  });