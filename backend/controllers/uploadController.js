// backend/controllers/uploadController.js
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const pool = require('../db');

// Allowed types & size limit
const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
const maxSize = 2 * 1024 * 1024; // 2MB

// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9_-]+/gi, '')
      .slice(0, 40) || 'img';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.has(file.mimetype)) {
    return cb(new Error('Only image files are allowed (.jpg, .jpeg, .png, .webp)'));
  }
  cb(null, true);
};

const multerUpload = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter
});

async function uploadProductImage(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file received' });

    const imagePath = `/uploads/${req.file.filename}`;
    const productId = req.body?.productId || req.query?.productId;

    if (productId) {
      const { rowCount } = await pool.query(
        `UPDATE products SET image = $1 WHERE product_id = $2 AND is_active = true`,
        [imagePath, productId]
      );
      if (rowCount === 0) return res.status(404).json({ error: 'Product not found' });
      return res.json({ image: imagePath, message: 'Product image updated.' });
    }

    return res.json({ image: imagePath, message: 'Image uploaded.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  multerUpload,
  uploadProductImage
};