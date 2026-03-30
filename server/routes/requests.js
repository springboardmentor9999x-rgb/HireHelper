const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authMiddleware = require('./middleware/authmiddleware');

router.use(authMiddleware);

// POST /api/requests - Create a request
router.post('/', requestController.createRequest);

// GET /api/requests/me - Get requests sent by the current user
router.get('/me', requestController.getMyRequests);

// GET /api/requests/incoming - Get requests for tasks owned by the current user
router.get('/incoming', requestController.getIncomingRequests);

// GET /api/requests/task/:taskId - Get requests for a specific task (for creators)
router.get('/task/:taskId', requestController.getRequestsForTask);

// PUT /api/requests/:id/status - Update request status (Accept/Reject)
router.put('/:id/status', requestController.updateRequestStatus);

module.exports = router;
