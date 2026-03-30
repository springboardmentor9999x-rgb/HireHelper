const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// GET /api/public/stats - Fetch public landing page statistics
router.get('/stats', publicController.getStats);

module.exports = router;
