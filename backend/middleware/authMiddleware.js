import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect routes - verifies JWT and loads user
export const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token with secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID in token, exclude password
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Proceed to next middleware/route
      next();
    } catch (err) {
      console.error("Auth Error:", err.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Export as default as well for backward compatibility
export default protect;

// Admin guard middleware
export const isAdmin = (req, res, next) => {
  try {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ message: 'Admin access required' });
  } catch (e) {
    return res.status(403).json({ message: 'Admin access required' });
  }
};