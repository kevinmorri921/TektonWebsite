import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger, { scrub } from "../logger.js";
import { validationSchemas, handleValidationErrors, sendSafeError } from "../middleware/validation.js";

const router = express.Router();

// JWT_SECRET will be validated when route is used (after dotenv.config() in server)
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is not set.");
  }
  return secret;
};

// 🧩 POST /api/login
router.post(
  "/",
  // Input validation
  validationSchemas.email,
  validationSchemas.password,
  handleValidationErrors,
  async (req, res) => {
  try {
    const JWT_SECRET = getJWTSecret();
    const { email, password } = req.body;
    logger.info("[LOGIN] Incoming login attempt for email=%s from %s", email, req.ip);

    if (!email || !password) {
      logger.warn("[LOGIN] Missing credentials from %s", req.ip);
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn("[LOGIN] Failed login - user not found email=%s from=%s", email, req.ip);
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn("[LOGIN] Failed login - invalid password for email=%s from=%s", email, req.ip);
      return res.status(400).json({ success: false, message: "Invalid password" });
    }

    // ✅ Check if user account is enabled (not deactivated by admin)
    if (user.isEnabled === false) {
      logger.warn("[LOGIN] Failed login - account deactivated for email=%s from=%s", email, req.ip);
      return res.status(403).json({ success: false, message: "Your account has been deactivated by the administrator. Please contact support." });
    }

    // ✅ Update last login AFTER successful login
    user.lastLoginAt = new Date();
    await user.save();

    // ✅ Include role in JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      fullname: user.fullname,
      role: user.role,
    });

    logger.info("[LOGIN] Login successful for email=%s userId=%s", user.email, user._id);
  } catch (error) {
    logger.error("[LOGIN] Server error on login attempt: %o", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
  }
);

export default router;
