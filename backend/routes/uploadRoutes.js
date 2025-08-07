const express = require('express');
const router = express.Router();
const { multerUpload, uploadProductImage } = require('../controllers/uploadController');


router.post('/product', multerUpload.single('image'), uploadProductImage);

module.exports = router;