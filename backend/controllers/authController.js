import User from "../models/User.js";
import Product from "../models/productModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import nodemailer from "nodemailer";

// ✅ Signup
export const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid input", errors: errors.array() });
    }
    const { name, email, password } = req.body;

    // check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // issue JWT so frontend can stay logged in after signup
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const safeUser = { name: newUser.name, email: newUser.email, _id: newUser._id };
    res.status(201).json({ message: "User created successfully", token, user: safeUser });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🛒 Server-side Cart & Wishlist (top-level exports)
export const getServerCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({ path: 'cart.product', select: 'name price image' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const cart = (user.cart || []).map(i => ({
      _id: i.product?._id,
      name: i.product?.name,
      price: i.product?.price,
      image: i.product?.image,
      quantity: i.quantity,
    })).filter(i => i._id);
    res.json({ items: cart });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateServerCart = async (req, res) => {
  try {
    const { items } = req.body; // [{_id, quantity}]
    if (!Array.isArray(items)) return res.status(400).json({ message: 'Invalid items' });
    // Guard against runaway payloads
    if (items.length > 200) return res.status(400).json({ message: 'Too many items' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Dedupe by product id and clamp quantity 1..100
    const map = new Map();
    for (const i of items) {
      const id = i?._id || i?.product;
      if (!id) continue;
      const q = Math.max(1, Math.min(100, Number(i.quantity) || 1));
      map.set(String(id), { product: id, quantity: q }); // last write wins
    }
    // Verify that all product IDs exist
    const ids = Array.from(map.keys());
    const existing = await Product.find({ _id: { $in: ids } }).select('_id');
    const validSet = new Set(existing.map(d => String(d._id)));
    user.cart = Array.from(map.entries())
      .filter(([id]) => validSet.has(id))
      .map(([, v]) => v);
    await user.save();
    res.json({ message: 'Cart updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getServerWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({ path: 'wishlist.product', select: 'name price image' });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const wishlist = (user.wishlist || []).map(w => ({ _id: w.product?._id, name: w.product?.name, price: w.product?.price, image: w.product?.image })).filter(w => w._id);
    res.json({ items: wishlist });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateServerWishlist = async (req, res) => {
  try {
    const { items } = req.body; // [{_id}]
    if (!Array.isArray(items)) return res.status(400).json({ message: 'Invalid items' });
    if (items.length > 500) return res.status(400).json({ message: 'Too many items' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const set = new Set();
    for (const i of items) {
      const id = i?._id || i?.product;
      if (id) set.add(String(id));
    }
    const wlIds = Array.from(set);
    const wlExisting = await Product.find({ _id: { $in: wlIds } }).select('_id');
    const wlValid = new Set(wlExisting.map(d => String(d._id)));
    user.wishlist = wlIds.filter(id => wlValid.has(id)).map(id => ({ product: id }));
    await user.save();
    res.json({ message: 'Wishlist updated' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ Login
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid input", errors: errors.array() });
    }
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get Profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "Profile retrieved successfully", user });
  } catch (err) {
    console.error("❌ Get profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Update Profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already taken" });
      }
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");
    
    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("❌ Update profile error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Contact Admin (protected)
export const contactAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Invalid input", errors: errors.array() });
    }
    const { subject, message } = req.body;
    const user = req.user;

    // Configure transporter (use Gmail or SMTP from env)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      replyTo: user.email,
      subject: `[CraftConnect Contact] ${subject}`,
      text: `From: ${user.name} <${user.email}>
UserId: ${user._id}

${message}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Your message was sent to the admin." });
  } catch (err) {
    console.error("❌ Contact admin error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// ✅ Get all artisans with product counts
export const getArtisans = async (req, res) => {
  try {
    const artisans = await User.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "artisan",
          as: "products"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          createdAt: 1,
          productCount: { $size: "$products" }
        }
      },
      {
        $match: { productCount: { $gt: 0 } }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    // Add dummy artisans if none exist
    if (artisans.length === 0) {
      const dummyArtisans = [
        {
          _id: "dummy1",
          name: "Aarav Mehta",
          email: "aarav@example.com",
          createdAt: new Date(),
          productCount: 3
        },
        {
          _id: "dummy2", 
          name: "Priya Sharma",
          email: "priya@example.com",
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          productCount: 5
        },
        {
          _id: "dummy3",
          name: "Ravi Kumar", 
          email: "ravi@example.com",
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
          productCount: 2
        }
      ];
      return res.json(dummyArtisans);
    }

    res.json(artisans);
  } catch (err) {
    console.error("❌ Get artisans error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
