const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const taskController = require('../controllers/taskController');
const verifyToken = require('../middleware/authMiddleware');

// Configure multer for task image uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'task-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(`Invalid file type: ${file.mimetype}. Only images (JPEG, PNG, GIF, WebP) are allowed.`);
    cb(error, false);
  }
};

const uploadTask = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// GET feed - all tasks from all users (MUST come before /:id routes)
router.get('/feed', verifyToken, taskController.getFeed);

// GET all tasks for logged-in user - alias (MUST come before /:id routes)
router.get('/my', verifyToken, taskController.getTasks);

// GET all tasks for logged-in user (my-tasks endpoint)
router.get('/my-tasks', verifyToken, taskController.getTasks);

// Error handler for multer errors on create task
const handleCreateUploadError = (err, req, res, next) => {
  if (err) {
    console.error('📸 [Upload Error on Create]', err.message);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    }
    return res.status(415).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// POST create new task (with optional image upload)
router.post('/', verifyToken, uploadTask.single('image'), handleCreateUploadError, taskController.createTask);

// Error handler for multer errors on update task
const handleUpdateUploadError = (err, req, res, next) => {
  if (err) {
    console.error('📸 [Upload Error on Update]', err.message);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    }
    return res.status(415).json({
      success: false,
      message: err.message
    });
  }
  next();
};

// PATCH close task
router.patch('/:id/close', verifyToken, taskController.closeTask);

// GET single task by ID (MUST come after /feed and /my)
router.get('/:id', verifyToken, taskController.getTaskById);

// PUT update task (with optional image upload)
router.put('/:id', verifyToken, uploadTask.single('image'), handleUpdateUploadError, taskController.updateTask);

// DELETE task
router.delete('/:id', verifyToken, taskController.deleteTask);

// GET all tasks for logged-in user (fallback)
router.get('/', verifyToken, taskController.getTasks);

module.exports = router;