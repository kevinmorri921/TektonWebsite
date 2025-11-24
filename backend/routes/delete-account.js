// routes/delete-account.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger from "../logger.js";
import { sendSafeError } from "../middleware/validation.js";

const router = express.Router();

// Allowed roles for profile access
const ALLOWED_ROLES = ["SUPER_ADMIN", "admin", "encoder", "researcher"];

router.delete("/", async (req, res) => {
  logger.info("[DELETE-ACCOUNT] Incoming delete-account request from %s", req.ip);

  try {
    // 1️⃣ Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      logger.warn("[DELETE-ACCOUNT] No token provided from %s", req.ip);
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 2️⃣ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      logger.info("[DELETE-ACCOUNT] Token verified for userId=%s", decoded.userId);
    } catch (error) {
      logger.warn("[DELETE-ACCOUNT] Invalid token from %s", req.ip);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // 3️⃣ Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn("[DELETE-ACCOUNT] User not found userId=%s", decoded.userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 4️⃣ Check if user has allowed role
    if (!ALLOWED_ROLES.includes(user.role)) {
      logger.warn("[DELETE-ACCOUNT] Unauthorized role access for userId=%s role=%s", decoded.userId, user.role);
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete account",
      });
    }

    // 5️⃣ Prevent super admin deletion (optional security measure)
    if (user.email === 'super_admin@tekton.com') {
      logger.warn("[DELETE-ACCOUNT] Attempt to delete super admin account from %s", req.ip);
      return res.status(403).json({
        success: false,
        message: "Super admin account cannot be deleted",
      });
    }

    // 6️⃣ Delete user
    const deletedUser = await User.findByIdAndDelete(decoded.userId);
    
    if (!deletedUser) {
      logger.warn("[DELETE-ACCOUNT] User not found for deletion userId=%s", decoded.userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info("[DELETE-ACCOUNT] Account deleted successfully for user=%s userId=%s", deletedUser.email, deletedUser._id);

    // 7️⃣ Success response
    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });

  } catch (error) {
    logger.error("[DELETE-ACCOUNT] Server error: %o", error);
    sendSafeError(res, 500, "Server error. Please try again later.", process.env.NODE_ENV === "development");
  }
});

export default router;