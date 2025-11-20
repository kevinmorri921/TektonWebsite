// routes/change-password.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger, { scrub } from "../logger.js";

const router = express.Router();

/**
 * 🧩 POST /api/auth/change-password
 * Handles password change with authentication
 */
router.post("/", async (req, res) => {
  logger.info("[CHANGE-PASSWORD] Incoming request from %s", req.ip);

  const { currentPassword, newPassword } = req.body;

  try {
    // 1️⃣ Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      logger.warn("[CHANGE-PASSWORD] No token provided for change-password from %s", req.ip);
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 2️⃣ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      logger.info("[CHANGE-PASSWORD] Token verified for userId=%s", decoded.id);
    } catch (error) {
      logger.warn("[CHANGE-PASSWORD] Invalid token from %s", req.ip);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // 3️⃣ Validate request body
    if (!currentPassword || !newPassword) {
      logger.warn("[CHANGE-PASSWORD] Missing passwords for userId=%s", decoded.id);
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // 4️⃣ Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      logger.warn("[CHANGE-PASSWORD] User not found userId=%s", decoded.id);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 5️⃣ Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      logger.warn("[CHANGE-PASSWORD] Incorrect current password attempt for user=%s from=%s", user.email, req.ip);
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

    logger.info("[CHANGE-PASSWORD] Password updated successfully for user=%s", user.email);

    // 8️⃣ Success response
    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    logger.error("[CHANGE-PASSWORD] Server error: %o", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;