const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.get('/me', authMiddleware, userController.getMe);

router.put(
  '/update-profile',
  authMiddleware,
  upload.single('profile_image'),
  userController.updateProfile
);

router.get('/:id', authMiddleware, userController.getUserById);

module.exports = router;