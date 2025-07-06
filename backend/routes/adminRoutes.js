const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const {
  getAllUsers,
  getAllOrders,
  updateOrderStatus,
  deleteUser,
  updateProduct,
  getMetrics,
  createProduct
} = require('../controllers/adminController');
const { deleteProduct } = require('../controllers/adminController');
const { getOrderItemsByOrderId } = require('../controllers/adminController'); 

// Middleware for getting order items by order ID
router.get('/orders/:id/items', getOrderItemsByOrderId);
// Admin middleware
router.use(auth);
router.use(isAdmin);

// Routes
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.post('/products', createProduct);
router.get('/orders', getAllOrders);
router.patch('/orders/:id', updateOrderStatus);

router.delete('/products/:id', deleteProduct);
router.put('/products/:id', updateProduct); // optional for editing

router.get('/api/admin/metrics', getMetrics)

module.exports = router;
