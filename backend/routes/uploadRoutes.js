const express = require('express');
const { uploadProductImage } = require('../controllers/uploadController');
const router = express.Router();

router.post('/products/image', uploadProductImage);

module.exports = router;