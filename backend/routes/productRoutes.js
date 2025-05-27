const express = require('express');
   const router = express.Router();
   const { addProduct, getProducts } = require('../controllers/productController');
   const isAdmin = require('../middleware/isAdmin');
   const auth = require('../middleware/auth');
   
   
   router.get('/', (req, res, next) => {
    console.log('Handling GET /api/products');
    next();
  }, getProducts);
   router.post('/', auth, isAdmin, addProduct);

   module.exports = router;