const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.Middleware");
const {
  addTask,
  getMyTasks,
  getFeedTasks,
  updateTask,
  deleteTask,
  closeTask,
  reopenTask
} = require("../controllers/taskController");

router.post("/", verifyToken, addTask);
router.post("/add", verifyToken, addTask);
router.get("/my", verifyToken, getMyTasks);
router.get("/", verifyToken, getFeedTasks);
router.get("/feed", verifyToken, getFeedTasks);
router.put("/:id", verifyToken, updateTask);
router.delete("/:id", verifyToken, deleteTask);
router.put("/:id/close", verifyToken, closeTask);
router.put("/:id/reopen", verifyToken, reopenTask);

module.exports = router;
