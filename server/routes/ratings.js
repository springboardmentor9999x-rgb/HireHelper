const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const authMiddleware = require('./middleware/authmiddleware');

router.post('/', authMiddleware, ratingController.submitRating);

module.exports = router;
