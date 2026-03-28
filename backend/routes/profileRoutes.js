const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.Middleware');
const { updateProfilePicture } = require('../controllers/profileController');

router.put('/profile-picture', verifyToken, updateProfilePicture);

module.exports = router;
