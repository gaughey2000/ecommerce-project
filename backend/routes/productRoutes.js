const express = require('express');
   const router = express.Router();
   const { addProduct } = require('../controllers/productController');
   const isAdmin = require('../middleware/isAdmin');
   const auth = require('../middleware/auth');

   router.post('/', auth, isAdmin, addProduct);

   module.exports = router;