const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const {
  getAllUsers,
  getAllOrders,
  updateOrderStatus,
  deleteUser,
  updateProduct
} = require('../controllers/adminController');
const { deleteProduct } = require('../controllers/adminController');

// Admin middleware
router.use(auth);
router.use(isAdmin);

// Routes
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

router.get('/orders', getAllOrders);
router.patch('/orders/:id', updateOrderStatus);

router.delete('/products/:id', deleteProduct);
router.put('/products/:id', updateProduct); // optional for editing

module.exports = router;
