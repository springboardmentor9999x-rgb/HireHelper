const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('./middleware/authmiddleware');

// All task routes are protected
router.use(authMiddleware);

// POST /api/tasks - Add a task
router.post('/', taskController.addTask);

// GET /api/tasks - Get tasks created by other users (Feed)
router.get('/', taskController.getFeed);

// GET /api/tasks/my - Get tasks created by the logged-in user
router.get('/my', taskController.getMyTasks);

// GET /api/tasks/:id - Get a single task
router.get('/:id', taskController.getTaskById);

// PUT /api/tasks/:id - Update a task
router.put('/:id', taskController.updateTask);

// PATCH /api/tasks/:id/complete - Mark a task as completed
router.patch('/:id/complete', taskController.completeTask);

// PATCH /api/tasks/:id/status - Cycle task status (OPEN → ASSIGNED → CLOSED)
router.patch('/:id/status', taskController.updateTaskStatus);

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
