const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  sendRequest,
  getIncomingRequests,
  getMyRequests,
  acceptRequest,
  rejectRequest,
  markDone,
  confirmCompletion,
  disputeCompletion,
} = require("../controllers/requestController");

// Send a request to a task
router.post("/", protect, sendRequest);

// Get incoming requests for my tasks
router.get("/incoming", protect, getIncomingRequests);

// Get requests I've sent
router.get("/my", protect, getMyRequests);

// Accept a request
router.put("/:id/accept", protect, acceptRequest);

// Reject a request
router.put("/:id/reject", protect, rejectRequest);

// Helper marks work as done
router.put("/:id/mark-done", protect, markDone);

// Task owner confirms completion
router.put("/task/:taskId/confirm", protect, confirmCompletion);

// Task owner disputes completion
router.put("/task/:taskId/dispute", protect, disputeCompletion);

module.exports = router;
