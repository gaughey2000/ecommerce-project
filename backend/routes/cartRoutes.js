const express = require('express');
const { addToCartValidation, updateCartValidation } = require('../middleware/validation/cartValidation');
const { validate } = require('../middleware/validation/validate');
const {
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  getCart
} = require('../controllers/cartController');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
console.log('Cart routes file loaded');

router.post('/', authenticateToken, addToCartValidation, validate, addToCart);
router.patch('/:cartItemId', authenticateToken, updateCartValidation, validate, updateCartQuantity);
router.delete('/:cartItemId', authenticateToken, removeFromCart);
router.delete('/user/:userId', authenticateToken, clearCart);
router.get('/', authenticateToken, getCart);



module.exports = router;