import express from "express";
import ActivityLog from "../models/activityLog.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import logger from "../logger.js";
import { body, query, validationResult } from "express-validator";

const router = express.Router();

/**
 * POST /api/activity-log
 * Save a new activity log entry
 * Can be called by authenticated users or from internal endpoints
 */
router.post(
  "/",
  auth,
  body("action")
    .isIn(["Uploaded Marker", "Downloaded File", "Created Survey", "Updated Survey", "Deleted Marker", "Sign Out"])
    .withMessage("Invalid action type"),
  body("details").optional().isString(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { action, details } = req.body;
      const user = req.user; // From auth middleware

      const activityLog = new ActivityLog({
        username: user.fullname || user.email.split("@")[0],
        email: user.email,
        userId: user.id,
        action,
        details: details || null,
      });

      await activityLog.save();

      logger.info(
        "[ACTIVITY LOG] New entry: action=%s user=%s email=%s",
        action,
        user.fullname,
        user.email
      );

      res.status(201).json({
        success: true,
        message: "Activity logged successfully",
        data: activityLog,
      });
    } catch (error) {
      logger.error("[ACTIVITY LOG] Error saving log entry: %o", error);
      res.status(500).json({
        success: false,
        message: "Failed to log activity",
      });
    }
  }
);

/**
 * GET /api/activity-log
 * Fetch all activity logs with filtering, searching, and pagination
 * Admin only
 */
router.get(
  "/",
  adminAuth,
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("search").optional().isString().trim(),
  query("action").optional().isString(),
  query("email").optional().isEmail(),
  query("startDate").optional().isISO8601(),
  query("endDate").optional().isISO8601(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter = {};

      if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, "i");
        filter.$or = [
          { username: searchRegex },
          { email: searchRegex },
          { details: searchRegex },
        ];
      }

      if (req.query.action) {
        filter.action = req.query.action;
      }

      if (req.query.email) {
        filter.email = req.query.email.toLowerCase();
      }

      // Date range filtering
      if (req.query.startDate || req.query.endDate) {
        filter.createdAt = {};
        if (req.query.startDate) {
          filter.createdAt.$gte = new Date(req.query.startDate);
        }
        if (req.query.endDate) {
          filter.createdAt.$lte = new Date(req.query.endDate);
        }
      }

      // Fetch total count for pagination
      const total = await ActivityLog.countDocuments(filter);

      // Fetch logs sorted by newest first
      const logs = await ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .exec();

      logger.info(
        "[ACTIVITY LOG] Fetched %d logs with filter=%o by admin=%s",
        logs.length,
        filter,
        req.user?.id
      );

      res.json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error("[ACTIVITY LOG] Error fetching logs: %o", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch activity logs",
      });
    }
  }
);

/**
 * GET /api/activity-log/stats
 * Get activity statistics (optional)
 * Admin only
 */
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const stats = await ActivityLog.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalLogs = await ActivityLog.countDocuments();

    res.json({
      success: true,
      data: {
        totalActivities: totalLogs,
        breakdown: stats,
      },
    });
  } catch (error) {
    logger.error("[ACTIVITY LOG] Error fetching stats: %o", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
    });
  }
});

export default router;
