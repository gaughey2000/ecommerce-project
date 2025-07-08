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
  getOrderItemsByOrderId
} = require('../controllers/adminController');

// Protect all routes: must be authenticated and admin
router.use(auth, requireRole('admin'));

// Admin Routes
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

router.get('/orders', getAllOrders);
router.patch('/orders/:id', updateOrderStatus);
router.get('/orders/:id/items', getOrderItemsByOrderId);

router.get('/metrics', getMetrics); // Fixed route path here (was /api/admin/metrics)
module.exports = router;
