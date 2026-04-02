import { Router } from 'express';
import { sendRequest, getMyRequests, getReceivedRequests, updateRequestStatus, cancelRequest } from '../controllers/requestController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All request routes are protected
router.post('/', authMiddleware, sendRequest);
router.get('/my', authMiddleware, getMyRequests);
router.get('/received', authMiddleware, getReceivedRequests);
router.put('/:id', authMiddleware, updateRequestStatus);
router.delete('/:id', authMiddleware, cancelRequest);

export default router;
