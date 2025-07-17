const multer = require('multer');
const path = require('path');
const pool = require('../db');

// Allowed types & size limit
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const maxSize = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    cb(null, `${Date.now()}_${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error('Only image files are allowed (.jpg, .jpeg, .png, .webp)'));
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter
});

const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

const uploadProductImage = [
  upload.single('image'),
  handleMulterError,
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file received' });
    }

    try {
      const imagePath = `/uploads/${req.file.filename}`;
      res.json({ image: imagePath });
    } catch (err) {
      console.error('Product image processing failed:', err.stack);
      res.status(500).json({ error: 'Image upload failed' });
    }
  }
];

const uploadProfileImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file received' });
  }

  try {
    const imagePath = `/uploads/${req.file.filename}`;
    await pool.query(
      'UPDATE users SET profile_image = $1 WHERE user_id = $2',
      [imagePath, req.user.userId]
    );
    res.json({ profile_image: imagePath });
  } catch (err) {
    console.error('Profile image DB update failed:', err.stack);
    res.status(500).json({ error: 'Could not save profile image' });
  }
};

module.exports = {
  uploadProductImage,
  uploadProfileImage,
  handleMulterError
};