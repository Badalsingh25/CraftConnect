import express from 'express';
import { getPaymentConfig, createRazorpayOrder, verifyRazorpaySignature, razorpayWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/payments/config
router.get('/config', getPaymentConfig);

// POST /api/payments/create-order
router.post('/create-order', protect, createRazorpayOrder);

// POST /api/payments/verify
router.post('/verify', protect, verifyRazorpaySignature);

// POST /api/payments/webhook (raw body expected)
router.post('/webhook', razorpayWebhook);

export default router;
