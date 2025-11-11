import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "devSecretKey123";
/**
 * 🧩 POST /api/login
 * Handles user login authentication with detailed logging
 */
router.post("/", async (req, res) => {
  console.log("🟡 [LOGIN] Incoming request:", req.body);

  const { email, password } = req.body;

  try {
    // 1️⃣ Validate request body
    if (!email || !password) {
      console.log("🔴 [LOGIN] Missing email or password");
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 2️⃣ Check if user exists
    console.log("🔍 [LOGIN] Searching for user:", email);
    const user = await User.findOne({ email });

    if (!user) {
      console.log("🔴 [LOGIN] User not found:", email);
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("🟢 [LOGIN] User found:", user.email);

    // 3️⃣ Compare password
    console.log("🔍 [LOGIN] Comparing password for:", email);
    if (!user.password) {
      console.error("⚠ [LOGIN] User record has no password field!");
      return res.status(500).json({
        success: false,
        message: "Corrupted user record (missing password)",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🧩 [LOGIN] Password match result:", isMatch);

    if (!isMatch) {
      console.log("🔴 [LOGIN] Invalid password for:", email);
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    // 4️⃣ Verify JWT secret is set
    if (!process.env.JWT_SECRET) {
      console.error("❌ [LOGIN] Missing JWT_SECRET in environment variables");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: missing JWT secret",
      });
    }

    // 5️⃣ Generate JWT token
    console.log("🧾 [LOGIN] Generating JWT for:", user.email);
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1d",
    });

    // 6️⃣ Success response
    console.log("✅ [LOGIN] Login successful for:", user.fullname);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      fullname: user.fullname,
    });
  } catch (error) {
    // 7️⃣ Catch all unexpected server errors
    console.error("🔥 [LOGIN] Server error during login:", error);

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
