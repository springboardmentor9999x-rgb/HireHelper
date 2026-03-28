const pool = require("../config/db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'profile-photos');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

exports.updateProfilePicture = async (req, res) => {
  upload.single('profile_picture')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const profilePicture = req.file ? `/uploads/profile-photos/${req.file.filename}` : null;

      await pool.query(
        `UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING profile_picture`,
        [profilePicture, req.user.id]
      );

      return res.json({ message: 'Profile picture updated successfully', profile_picture: profilePicture });
    } catch (dbErr) {
      console.error(dbErr);
      return res.status(500).json({ message: 'Server error' });
    }
  });
};

