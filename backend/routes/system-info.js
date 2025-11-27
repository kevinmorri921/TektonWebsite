import express from "express";
import jwt from "jsonwebtoken";
import SystemInfo from "../models/systemInfo.js";
import logger from "../logger.js";
import { sendSafeError } from "../middleware/validation.js";

const router = express.Router();

// Allowed roles
const ALLOWED_ROLES = ["SUPER_ADMIN", "admin"];

// ✅ POST /api/system-info - Collect system information
router.post(
  "/",
  async (req, res) => {
    logger.info("[SYSTEM-INFO] Incoming system info collection from %s", req.ip);

    try {
      // 1️⃣ Get token from header
      const token = req.headers.authorization?.split(" ")[1];
      
      if (!token) {
        logger.warn("[SYSTEM-INFO] No token provided from %s", req.ip);
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // 2️⃣ Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info("[SYSTEM-INFO] Token verified for userId=%s", decoded.userId);
      } catch (error) {
        logger.warn("[SYSTEM-INFO] Invalid token from %s", req.ip);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      // 3️⃣ Extract system info from request
      const systemInfo = {
        userId: decoded.userId,
        ipAddress: req.ip || req.connection.remoteAddress || "N/A",
        os: req.body.os || "N/A",
        browser: req.body.browser || {},
        screenResolution: req.body.screenResolution || "N/A",
        deviceType: req.body.deviceType || "N/A",
        cpuArchitecture: req.body.cpuArchitecture || "N/A",
        language: req.body.language || "N/A",
        timezone: req.body.timezone || "N/A",
        networkType: req.body.networkType || "N/A",
        ram: req.body.ram || "N/A",
        gpu: req.body.gpu || "N/A",
        userAgent: req.body.userAgent || "N/A",
        timestamp: new Date(),
      };

      // 4️⃣ Save to database
      const newSystemInfo = new SystemInfo(systemInfo);
      await newSystemInfo.save();

      logger.info("[SYSTEM-INFO] System info saved for userId=%s", decoded.userId);

      res.status(200).json({
        success: true,
        message: "System information collected successfully",
        data: newSystemInfo,
      });
    } catch (error) {
      logger.error("[SYSTEM-INFO] Error: %o", error);
      sendSafeError(res, 500, "Error collecting system information", process.env.NODE_ENV === "development");
    }
  }
);

// ✅ GET /api/system-info/analytics - Get analytics
router.get(
  "/analytics",
  async (req, res) => {
    logger.info("[SYSTEM-INFO-ANALYTICS] Fetching analytics from %s", req.ip);

    try {
      // 1️⃣ Get token from header
      const token = req.headers.authorization?.split(" ")[1];
      
      if (!token) {
        logger.warn("[SYSTEM-INFO-ANALYTICS] No token provided from %s", req.ip);
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // 2️⃣ Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        logger.warn("[SYSTEM-INFO-ANALYTICS] Invalid token from %s", req.ip);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      // 3️⃣ Get analytics from database
      const osUsage = await SystemInfo.aggregate([
        { $group: { _id: "$os", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const browserUsage = await SystemInfo.aggregate([
        { $group: { _id: "$browser.name", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const deviceTypeUsage = await SystemInfo.aggregate([
        { $group: { _id: "$deviceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const networkTypeUsage = await SystemInfo.aggregate([
        { $group: { _id: "$networkType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const topDevices = await SystemInfo.aggregate([
        {
          $group: {
            _id: {
              deviceType: "$deviceType",
              os: "$os",
              browser: "$browser.name",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            deviceType: "$_id.deviceType",
            os: "$_id.os",
            browser: "$_id.browser",
            count: 1,
          },
        },
      ]);

      logger.info("[SYSTEM-INFO-ANALYTICS] Analytics fetched successfully");

      res.status(200).json({
        success: true,
        osUsage,
        browserUsage,
        deviceTypeUsage,
        networkTypeUsage,
        topDevices,
      });
    } catch (error) {
      logger.error("[SYSTEM-INFO-ANALYTICS] Error: %o", error);
      sendSafeError(res, 500, "Error fetching analytics", process.env.NODE_ENV === "development");
    }
  }
);

export default router;
