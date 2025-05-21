const express = require('express');
const { getProducts, updateProduct } = require('../controllers/productController');
const router = express.Router();

router.get('/products', getProducts);
router.patch('/products/:id', updateProduct);

module.exports = router;