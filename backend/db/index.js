const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.PGUSER,     
  host: 'localhost',
  database: 'ecommerce',
  password: '',
  port: 5432
});

module.exports = pool;