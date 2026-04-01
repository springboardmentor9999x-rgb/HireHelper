console.log("✅ TASK ROUTES LOADED");

const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");
const authMiddleware = require("../middleware/auth.middleware");

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  taskController.addTask
);

router.get("/my", authMiddleware, taskController.getMyTasks);

router.get(
  "/feed",
  authMiddleware,   
  taskController.getFeedTasks
);

router.put("/:id/status", authMiddleware, taskController.updateTaskStatus);

router.post("/send-otp", authMiddleware, taskController.sendOtp);
router.post("/verify-otp", authMiddleware, taskController.verifyOtp);

module.exports = router;