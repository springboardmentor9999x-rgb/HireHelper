const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const verifyToken = require('../middleware/authMiddleware');

// GET feed - all tasks from all users (MUST come before /:id routes)
router.get('/feed', verifyToken, taskController.getFeed);

// GET all tasks for logged-in user - alias (MUST come before /:id routes)
router.get('/my', verifyToken, taskController.getTasks);

// GET all tasks for logged-in user (my-tasks endpoint)
router.get('/my-tasks', verifyToken, taskController.getTasks);

// POST create new task
router.post('/', verifyToken, taskController.createTask);

// PATCH close task
router.patch('/:id/close', verifyToken, taskController.closeTask);

// GET single task by ID (MUST come after /feed and /my)
router.get('/:id', verifyToken, taskController.getTaskById);

// PUT update task
router.put('/:id', verifyToken, taskController.updateTask);

// DELETE task
router.delete('/:id', verifyToken, taskController.deleteTask);

// GET all tasks for logged-in user (fallback)
router.get('/', verifyToken, taskController.getTasks);

module.exports = router;