const express = require('express');
const { addToCart, updateCartQuantity, removeFromCart, clearCart } = require('../controllers/cartController');
const authenticateToken = require('../middleware/auth');
const router = express.Router();
console.log('Cart routes file loaded');

router.post('/', authenticateToken, addToCart);
router.patch('/:cartItemId', authenticateToken, updateCartQuantity);
router.delete('/:cartItemId', authenticateToken, removeFromCart);
router.delete('/user/:userId', authenticateToken, clearCart);





module.exports = router;