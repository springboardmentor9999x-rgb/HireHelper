import { Router } from 'express';
import { createTask, getMyTasks, getFeedTasks, markTaskAsCompleted, verifyTaskCompletion, updateTask, cancelTask, unassignTask } from '../controllers/taskController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All task routes are protected
router.post('/', authMiddleware, createTask);
router.get('/my', authMiddleware, getMyTasks);
router.get('/', authMiddleware, getFeedTasks);
router.put('/:id', authMiddleware, updateTask);
router.put('/:id/complete', authMiddleware, markTaskAsCompleted);
router.put('/:id/verify', authMiddleware, verifyTaskCompletion);
router.post('/:id/cancel', authMiddleware, cancelTask);
router.post('/:id/unassign', authMiddleware, unassignTask);

export default router;
