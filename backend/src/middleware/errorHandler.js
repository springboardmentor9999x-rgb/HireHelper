const { HTTP_CODES, MESSAGES } = require('../config/constants');

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || HTTP_CODES.INTERNAL_SERVER_ERROR;
  const message = err.message || MESSAGES.ERROR;

  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
};

module.exports = errorHandler;
