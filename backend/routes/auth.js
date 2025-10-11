import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.js";

const router = express.Router();

// 🧩 SIGNUP Route
router.post("/signup", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    console.log("📩 Signup request received:", req.body);

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠ User already exists:", email);
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ fullname, email, password: hashedPassword });
    await newUser.save();

    console.log("✅ User registered:", newUser.email);
    res.status(201).json({ success: true, message: "User registered successfully" });

  } catch (error) {
    console.error("❌ Signup error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
