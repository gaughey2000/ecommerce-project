const multer = require('multer');
const path = require('path');

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

module.exports = { uploadProductImage };