import express from "express";
import { body } from "express-validator";
import { publicContact } from "../controllers/contactController.js";

const router = express.Router();

// Public contact form (no authentication required)
router.post("/public", [
  body("name").isString().isLength({ min: 2 }).trim(),
  body("email").optional().isEmail().normalizeEmail(),
  body("subject").isString().isLength({ min: 3 }).trim(),
  body("message").isString().isLength({ min: 10, max: 2000 }).trim(),
], publicContact);

export default router;
