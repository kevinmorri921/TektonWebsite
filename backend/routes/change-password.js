// routes/change-password.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();

/**
 * 🧩 POST /api/auth/change-password
 * Handles password change with authentication
 */
router.post("/", async (req, res) => {
  console.log("🟡 [CHANGE-PASSWORD] Incoming request");

  const { currentPassword, newPassword } = req.body;

  try {
    // 1️⃣ Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      console.log("🔴 [CHANGE-PASSWORD] No token provided");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 2️⃣ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("🟢 [CHANGE-PASSWORD] Token verified for user ID:", decoded.id);
    } catch (error) {
      console.log("🔴 [CHANGE-PASSWORD] Invalid token");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // 3️⃣ Validate request body
    if (!currentPassword || !newPassword) {
      console.log("🔴 [CHANGE-PASSWORD] Missing current or new password");
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // 4️⃣ Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("🔴 [CHANGE-PASSWORD] User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 5️⃣ Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      console.log("🔴 [CHANGE-PASSWORD] Current password is incorrect");
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // 6️⃣ Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 7️⃣ Update user password
    user.password = hashedNewPassword;
    await user.save();

    console.log("✅ [CHANGE-PASSWORD] Password updated successfully for:", user.email);

    // 8️⃣ Success response
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    console.error("🔥 [CHANGE-PASSWORD] Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;