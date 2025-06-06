const db = require('../db');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.query('SELECT id, email, role FROM users');
    res.json(users.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await db.query('SELECT * FROM orders');
    res.json(orders.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};