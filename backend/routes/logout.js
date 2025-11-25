import express from "express";
import ActivityLog from "../models/activityLog.js";
import auth from "../middleware/auth.js";
import logger from "../logger.js";

const router = express.Router();

/**
 * POST /api/logout
 * Handle user sign-out and log the event to MongoDB
 * Logs: username, email, role, eventType "Sign Out", IP address, timestamp
 */
router.post("/", auth, async (req, res) => {
  try {
    const user = req.user; // From auth middleware
    const ipAddress = req.ip || req.connection.remoteAddress || "Unknown";

    logger.info(
      "[LOGOUT] User signing out: email=%s username=%s role=%s from=%s",
      user.email,
      user.fullname,
      user.role,
      ipAddress
    );

    // ✅ Log sign-out activity to ActivityLog
    try {
      await ActivityLog.create({
        username: user.fullname || user.email.split("@")[0],
        email: user.email,
        action: "Sign Out",
        role: user.role,
        ipAddress: ipAddress,
        details: `Signed out from ${ipAddress}`,
        userId: null // Sign-out doesn't include userId per requirements
      });

      logger.info(
        "[LOGOUT] Sign-out event logged successfully for email=%s",
        user.email
      );
    } catch (logError) {
      logger.error("[LOGOUT] Failed to log sign-out event: %o", logError);
      // Don't fail the logout if logging fails
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });

  } catch (error) {
    logger.error("[LOGOUT] Server error during logout: %o", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout"
    });
  }
});

export default router;
