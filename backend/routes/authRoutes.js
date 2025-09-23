import express from "express";
import { body } from "express-validator";
import { signup, login, getProfile, updateProfile, contactAdmin, getArtisans, getServerCart, updateServerCart, getServerWishlist, updateServerWishlist } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// routes
router.post(
  "/signup",
  [
    body("name").isString().isLength({ min: 2 }).trim(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 })
  ],
  signup
);
router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 })
  ],
  login
);

// protected routes
router.get("/me", protect, (req, res) => {
  res.json({ message: "Welcome to your profile!", user: req.user });
});

router.get("/profile", protect, getProfile);
router.put("/profile", protect, upload.single("avatar"), updateProfile);

// server-side cart & wishlist
router.get("/me/cart", protect, getServerCart);
router.put("/me/cart", protect, updateServerCart);
router.get("/me/wishlist", protect, getServerWishlist);
router.put("/me/wishlist", protect, updateServerWishlist);

// contact admin (protected)
router.post("/contact", protect, [
  body("subject").isString().isLength({ min: 3 }).trim(),
  body("message").isString().isLength({ min: 10, max: 2000 }).trim(),
], contactAdmin);

// get artisans (public)
router.get("/artisans", getArtisans);

export default router;
