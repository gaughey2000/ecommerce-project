const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const {
  getAllUsers,
  getAllOrders,
  updateOrderStatus,
  deleteUser,
  updateProduct,
  getMetrics,
  createProduct,
  deleteProduct,
  getOrderItemsByOrderId,
  archiveProduct // <-- Add this line
} = require('../controllers/adminController');

router.use(auth, requireRole('admin'));

// Users
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Products
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.patch('/products/:id', archiveProduct); // <-- Add this line
router.delete('/products/:id', deleteProduct);  // (optional, if you want hard delete)

// Orders
router.get('/orders', getAllOrders);
router.patch('/orders/:id', updateOrderStatus);
router.get('/orders/:id/items', getOrderItemsByOrderId);

// Metrics
router.get('/metrics', getMetrics);

module.exports = router;