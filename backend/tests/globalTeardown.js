const { pool } = require('../index');

module.exports = async () => {
  await pool.end();
  console.log('🛑 Pool connection closed.');
};