const pool = require("../config/db");
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-photos/');
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
  try {
    upload.single('profile_picture')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const profilePicture = req.file ? `/uploads/profile-photos/${req.file.filename}` : null;

      await pool.query(
        `UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING profile_picture`,
        [profilePicture, req.user.id]
      );

      res.json({ message: 'Profile picture updated successfully', profile_picture: profilePicture });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

