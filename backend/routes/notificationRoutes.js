const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.Middleware");
const {
  getNotifications,
  deleteNotification,
  deleteAllNotifications,
  markAllNotificationsAsRead
} = require("../controllers/notificationController");

router.get("/", verifyToken, getNotifications);
router.put("/read-all", verifyToken, markAllNotificationsAsRead);
router.delete("/:id", verifyToken, deleteNotification);
router.delete("/", verifyToken, deleteAllNotifications);

module.exports = router;
