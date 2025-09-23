import express from "express";
import { getMyOrders, createOrders, updateOrderStatus, getCustomerOrders } from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/orders/mine
router.get("/mine", protect, getMyOrders);

// POST /api/orders/checkout - create orders from cart
router.post("/checkout", protect, createOrders);

// PATCH /api/orders/:id/status - update status
router.patch("/:id/status", protect, updateOrderStatus);
// PUT /api/orders/:id/status - update status (alternate for environments blocking PATCH)
router.put("/:id/status", protect, updateOrderStatus);

// GET /api/orders/customer - orders placed by current customer
router.get("/customer", protect, getCustomerOrders);

export default router;

