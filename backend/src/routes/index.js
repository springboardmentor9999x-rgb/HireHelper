const express = require('express');
const router = express.Router();

/**
 * Health Check Route
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API Routes
 */
router.use('/api/auth', require('./authRoutes'));
router.use('/api/users', require('./userRoutes'));

module.exports = router;