import express from 'express';
import { validateCoupon, listCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/couponController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/coupons/validate
router.post('/validate', protect, validateCoupon);

// Admin-lite endpoints (protected)
router.get('/', protect, isAdmin, listCoupons);
router.post('/', protect, isAdmin, createCoupon);
router.put('/:id', protect, isAdmin, updateCoupon);
router.delete('/:id', protect, isAdmin, deleteCoupon);

export default router;
