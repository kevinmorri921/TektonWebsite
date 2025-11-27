import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger from "../logger.js";
import { sendSafeError } from "../middleware/validation.js";

const router = express.Router();

// Allowed roles for profile access
const ALLOWED_ROLES = ["SUPER_ADMIN", "admin", "encoder", "researcher"];

router.get(
  "/",
  async (req, res) => {
    logger.info("[USER-PROFILE] Incoming request from %s", req.ip);

    try {
      // 1️⃣ Get token from header
      const token = req.headers.authorization?.split(" ")[1];
      
      if (!token) {
        logger.warn("[USER-PROFILE] No token provided from %s", req.ip);
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // 2️⃣ Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info("[USER-PROFILE] Token verified for userId=%s", decoded.userId);
      } catch (error) {
        logger.warn("[USER-PROFILE] Invalid token from %s", req.ip);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      // 3️⃣ Find user
      const user = await User.findById(decoded.userId);
      if (!user) {
        logger.warn("[USER-PROFILE] User not found userId=%s", decoded.userId);
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // 4️⃣ Check if user has allowed role
      if (!ALLOWED_ROLES.includes(user.role)) {
        logger.warn("[USER-PROFILE] Unauthorized role access for userId=%s role=%s", decoded.userId, user.role);
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access profile",
        });
      }

      logger.info("✅ [USER-PROFILE] Profile fetched for user=%s userId=%s", user.email, user._id);

      res.status(200).json({
        success: true,
        user: {
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          address: user.address || "",
          contactNumber: user.contactNumber || "",
        },
      });
    } catch (error) {
      logger.error("[USER-PROFILE] Error: %o", error);
      sendSafeError(res, 500, "Error fetching profile", process.env.NODE_ENV === "development");
    }
  }
);

export default router;
