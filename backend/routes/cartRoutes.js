const express = require('express');
const { addToCart, updateCartQuantity, removeFromCart, clearCart } = require('../controllers/cartController');
const authenticateToken = require('../middleware/auth');
const router = express.Router();

router.post('/cart', authenticateToken, addToCart);
router.patch('/cart/:cartItemId', authenticateToken, updateCartQuantity);
router.delete('/cart/:cartItemId', authenticateToken, removeFromCart);
router.delete('/cart/user/:userId', authenticateToken, clearCart);

module.exports = router;