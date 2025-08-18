// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const Admin = require('../controllers/adminController');

router.use(auth, requireRole('admin'));

// Users
router.get('/users', Admin.getAllUsers);
router.delete('/users/:id', Admin.deleteUser);

// Products
router.post('/products', Admin.createProduct);
router.put('/products/:id', Admin.updateProduct);
router.patch('/products/:id', Admin.archiveProduct); // soft delete
// router.delete('/products/:id', Admin.deleteProduct); // optional hard delete

// Orders
router.get('/orders', Admin.getAllOrders);
router.patch('/orders/:id', Admin.updateOrderStatus);
router.get('/orders/:id/items', Admin.getOrderItemsByOrderId);

// Metrics
router.get('/metrics', Admin.getMetrics);

module.exports = router;