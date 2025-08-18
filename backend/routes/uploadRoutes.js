const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { multerUpload, uploadProductImage, uploadProfileImage } = require('../controllers/uploadController');

// Product image upload (admin only)
router.post(
  '/products/image',
  auth,
  requireRole('admin'),
  multerUpload.single('image'),
  uploadProductImage
);


module.exports = router;