// routes/update-profile.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger from "../logger.js";
import { validationSchemas, handleValidationErrors, sanitizeInput, sendSafeError } from "../middleware/validation.js";

const router = express.Router();

// Allowed roles for profile access
const ALLOWED_ROLES = ["SUPER_ADMIN", "admin", "encoder", "researcher"];

router.post(
  "/",
  // Input validation
  validationSchemas.fullname,
  handleValidationErrors,
  async (req, res) => {
  logger.info("[UPDATE-PROFILE] Incoming request from %s", req.ip);

  const { fullname } = req.body;

  try {
    // 1️⃣ Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      logger.warn("[UPDATE-PROFILE] No token provided from %s", req.ip);
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 2️⃣ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      logger.info("[UPDATE-PROFILE] Token verified for userId=%s", decoded.userId);
    } catch (error) {
      logger.warn("[UPDATE-PROFILE] Invalid token from %s", req.ip);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // 3️⃣ Find user and check role
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn("[UPDATE-PROFILE] User not found userId=%s", decoded.userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 4️⃣ Check if user has allowed role
    if (!ALLOWED_ROLES.includes(user.role)) {
      logger.warn("[UPDATE-PROFILE] Unauthorized role access for userId=%s role=%s", decoded.userId, user.role);
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update profile settings",
      });
    }

    // 5️⃣ Validate request body
    if (!fullname || fullname.trim() === "") {
      logger.warn("[UPDATE-PROFILE] Missing fullname for userId=%s", decoded.id);
      return res.status(400).json({
        success: false,
        message: "Fullname is required",
      });
    }

    // 6️⃣ Update user name
    user.fullname = sanitizeInput.removeXSS(fullname.trim());
    await user.save();

    logger.info("✅ [UPDATE-PROFILE] Name updated successfully for user=%s userId=%s", user.email, user._id);

    // 7️⃣ Success response
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      fullname: user.fullname,
    });

  } catch (error) {
    logger.error("🔥 [UPDATE-PROFILE] Server error: %o", error);
    sendSafeError(res, 500, "Server error. Please try again later.", process.env.NODE_ENV === "development");
  }
  }
);

export default router;