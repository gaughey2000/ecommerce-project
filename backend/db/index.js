const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.USER,
  host: 'localhost',
  database: 'ecommerce',
  password: '',
  port: 5432
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Failed to connect to the database:', err.stack);
    return;
  }
  console.log('Successfully connected to the ecommerce database');
  release();
});

module.exports = pool;