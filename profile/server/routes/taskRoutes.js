const express = require("express");
const router = express.Router();
const {
  createTask,
  getMyTasks,
  getAllTasks,
  getTaskById,
  updateTaskStatus,
  deleteTask,
} = require("../controllers/taskController");

const multer = require("multer");
const protect = require("../middleware/authMiddleware");

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Routes
router.post("/", protect, upload.single("picture"), createTask);
router.get("/my", protect, getMyTasks);
router.get("/", protect, getAllTasks);
router.get("/:id", protect, getTaskById);
router.put("/:id/status", protect, updateTaskStatus);
router.delete("/:id", protect, deleteTask);

module.exports = router;
