const multer = require('multer');
const path = require('path');
const pool = require('../db');

// Set allowed extensions and max file size (2MB)
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const maxSize = 2 * 1024 * 1024; // 2MB

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname).toLowerCase());
  }
});

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error('Only image files are allowed'));
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: maxSize },
  fileFilter
});

// Controller: Upload profile image
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

// Controller: Upload product image
const uploadProductImage = [
  upload.single('image'),
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

module.exports = {
  uploadProductImage,
  uploadProfileImage
};