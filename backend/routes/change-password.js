// routes/change-password.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger, { scrub } from "../logger.js";
import { body } from "express-validator";
import { validationSchemas, handleValidationErrors, sendSafeError } from "../middleware/validation.js";

const router = express.Router();

// Allowed roles for profile access
const ALLOWED_ROLES = ["SUPER_ADMIN", "admin", "encoder", "researcher"];

/**
 * 🧩 POST /api/auth/change-password
 * Handles password change with authentication and role-based authorization
 */
router.post(
  "/",
  // Input validation
  body("currentPassword")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Current password is required"),
  body("newPassword")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage("Password must contain uppercase, lowercase, number, and special character"),
  handleValidationErrors,
  async (req, res) => {
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
      logger.info("[CHANGE-PASSWORD] Token verified for userId=%s", decoded.userId);
    } catch (error) {
      logger.warn("[CHANGE-PASSWORD] Invalid token from %s", req.ip);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // 3️⃣ Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn("[CHANGE-PASSWORD] User not found userId=%s", decoded.userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 4️⃣ Check if user has allowed role
    if (!ALLOWED_ROLES.includes(user.role)) {
      logger.warn("[CHANGE-PASSWORD] Unauthorized role access for userId=%s role=%s", decoded.userId, user.role);
      return res.status(403).json({
        success: false,
        message: "You do not have permission to change password",
      });
    }

    // 5️⃣ Validate request body
    if (!currentPassword || !newPassword) {
      logger.warn("[CHANGE-PASSWORD] Missing passwords for userId=%s", decoded.userId);
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // 6️⃣ Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      logger.warn("[CHANGE-PASSWORD] Incorrect current password attempt for user=%s from=%s", user.email, req.ip);
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // 7️⃣ Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 8️⃣ Update user password
    user.password = hashedNewPassword;
    await user.save();

    logger.info("[CHANGE-PASSWORD] Password updated successfully for user=%s", user.email);

    // 9️⃣ Success response
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
  }
);

export default router;