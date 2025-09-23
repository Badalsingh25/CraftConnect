import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

dotenv.config(); // Load .env variables at the start

const app = express();
// Behind Google App Engine proxy; needed for correct rate-limit client IPs
// Use a strict value only in production behind a known proxy. Disable in local dev.
const IS_GAE = !!process.env.GAE_ENV;
app.set('trust proxy', IS_GAE ? 1 : false);
const PORT = process.env.PORT || 5000;

// Middleware
const frontendOrigin = process.env.FRONTEND_ORIGIN || "*";

// Configure CORS to allow multiple origins for development and production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000', // Alternative dev server
      'https://craftconnect-hackathon-2025.uc.r.appspot.com', // Production frontend
      frontendOrigin // Environment-specific origin
    ];
    
    if (allowedOrigins.includes(origin) || frontendOrigin === "*") {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
  preflightContinue: true,
};

app.use(cors(corsOptions));
// Razorpay webhook must receive raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Universal CORS headers + preflight handler (no path patterns to avoid Express 5 path errors)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://craftconnect-hackathon-2025.uc.r.appspot.com',
    frontendOrigin
  ];
  if (!origin || allowedOrigins.includes(origin) || frontendOrigin === '*') {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// NOTE: Express 5 has stricter path-to-regexp; avoid using wildcard app.options('*').
// Our universal middleware above already handles OPTIONS and sets CORS headers.

// Basic rate limiting for auth and chatbot endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const chatLimiter = rateLimit({ windowMs: 60 * 1000, max: 20 });

// Static file serving for uploaded images - map /uploads to backend/upload
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Use writable temp dir on App Engine Standard; fall back to local 'upload' in dev
const uploadStaticDir = process.env.GAE_ENV ? path.join('/tmp', 'upload') : path.join(__dirname, 'upload');
if (!fs.existsSync(uploadStaticDir)) {
  fs.mkdirSync(uploadStaticDir, { recursive: true });
}
app.use("/uploads", express.static(uploadStaticDir));

// Health check endpoint for App Engine
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY 
  });
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/chatbot", chatLimiter, chatbotRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);

// Database connection and server start
mongoose
  .connect(process.env.MONGO_URI, {
    // Note: These options are default in modern Mongoose and can be omitted if using latest version
  })
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    console.log("Using GEMINI_API_KEY length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : "Missing");
  })
  .catch((err) => console.error("❌ DB Connection Error:", err));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY is not set. AI features will be disabled.');
}
