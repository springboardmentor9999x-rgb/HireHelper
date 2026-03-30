/**
 * Request Routes
 * All routes are protected with JWT authentication
 */

const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const verifyToken = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(verifyToken);

/**
 * Send Request - POST /api/requests
 * User sends a request to a task
 * 
 * Body: { task_id: UUID }
 */
router.post('/', requestController.sendRequest);

/**
 * Get My Requests - GET /api/requests/my
 * Get all requests sent by logged user
 */
router.get('/my', requestController.getMyRequests);

/**
 * Get Received Requests - GET /api/requests/received
 * Get all requests received for user's tasks
 */
router.get('/received', requestController.getReceivedRequests);

/**
 * Get Request Details - GET /api/requests/:id
 * Get details of a specific request
 */
router.get('/:id', requestController.getRequestById);

/**
 * Accept Request - PUT /api/requests/:id/accept
 * Task owner accepts a request
 */
router.put('/:id/accept', requestController.acceptRequest);

/**
 * Reject Request - PUT /api/requests/:id/reject
 * Task owner rejects a request
 */
router.put('/:id/reject', requestController.rejectRequest);

/**
 * Cancel Request - DELETE /api/requests/:id
 * User who sent request can cancel it
 */
router.delete('/:id', requestController.cancelRequest);

module.exports = router;
