import express from 'express';
import { listReviews, setReviewApproval } from '../controllers/reviewController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/reviews?status=pending|approved|all
router.get('/', protect, isAdmin, listReviews);

// PATCH /api/reviews/:id/approval
router.patch('/:id/approval', protect, isAdmin, setReviewApproval);

export default router;
