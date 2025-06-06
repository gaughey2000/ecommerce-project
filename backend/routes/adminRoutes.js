const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const { getAllUsers, getAllOrders } = require('../controllers/adminController');

router.use(isAdmin);
router.get('/users', getAllUsers);
router.get('/orders', getAllOrders);

module.exports = router;