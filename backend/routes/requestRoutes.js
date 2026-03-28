const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.Middleware");
const {
  createRequest,
  getNotifications,
  getMyRequests,
  getReceivedRequests,
  updateRequestStatus
} = require("../controllers/requestController");

router.get("/notifications", verifyToken, getNotifications);
router.get("/my", verifyToken, getMyRequests);
router.get("/received", verifyToken, getReceivedRequests);
router.post("/", verifyToken, createRequest);
router.put("/:id", verifyToken, updateRequestStatus);

module.exports = router;
