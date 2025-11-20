// routes/delete-account.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger from "../logger.js";

const router = express.Router();

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
      logger.info("[DELETE-ACCOUNT] Token verified for userId=%s", decoded.id);
    } catch (error) {
      logger.warn("[DELETE-ACCOUNT] Invalid token from %s", req.ip);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // 3️⃣ Find and delete user
    const user = await User.findByIdAndDelete(decoded.id);
    
    if (!user) {
      logger.warn("[DELETE-ACCOUNT] User not found userId=%s", decoded.id);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info("[DELETE-ACCOUNT] Account deleted successfully for user=%s userId=%s", user.email, user._id);

    // 4️⃣ Success response
    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });

  } catch (error) {
    logger.error("[DELETE-ACCOUNT] Server error: %o", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;