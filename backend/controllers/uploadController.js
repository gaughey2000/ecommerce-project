const multer = require('multer');
const path = require('path');
const pool = require('../db');

const uploadProfileImage = async (req, res) => {
  if (!req.file) {
    console.error('No file uploaded');
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
    console.error('Profile image upload failed:', err);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
};


const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const uploadProductImage = [
  upload.single('image'),
  async (req, res) => {
    try {
      const imagePath = `/uploads/${req.file.filename}`;
      res.json({ image: imagePath });
    } catch (err) {
      console.error('Image upload error:', err);
      res.status(500).json({ error: err.message });
    }
  }
];

module.exports = { uploadProductImage, uploadProfileImage };