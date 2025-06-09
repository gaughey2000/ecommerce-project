const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.get('/', (req, res, next) => {
  console.log('Handling GET /api/products');
  next();
}, getProducts);

router.get('/:id', getProductById);
router.post('/', auth, isAdmin, addProduct);
router.put('/:id', auth, isAdmin, updateProduct); 
router.delete('/:id', auth, isAdmin, deleteProduct);

module.exports = router;
