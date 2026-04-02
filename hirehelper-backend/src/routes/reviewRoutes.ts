import { Router } from 'express';
import { createReview, getReviewsForUser, getReviewsGivenByUser } from '../controllers/reviewController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createReview);
router.get('/user/:userId', authMiddleware, getReviewsForUser);
router.get('/given/:userId', authMiddleware, getReviewsGivenByUser);

export default router;
