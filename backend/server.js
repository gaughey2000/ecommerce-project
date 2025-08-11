// backend/server.js
const app = require('./app');
const pool = require('./db');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Connected to the ecommerce database');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ DB connection error:', err);
    process.exit(1);
  }
})();