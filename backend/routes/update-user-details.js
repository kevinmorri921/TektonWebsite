import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger from "../logger.js";
import { validationSchemas, handleValidationErrors, sanitizeInput, sendSafeError } from "../middleware/validation.js";
import { body } from "express-validator";

const router = express.Router();

// Allowed roles for profile access
const ALLOWED_ROLES = ["SUPER_ADMIN", "admin", "encoder", "researcher"];

router.post(
  "/",
  body("address").optional().trim().isLength({ max: 500 }).withMessage("Address too long"),
  body("contactNumber").optional().trim().isLength({ max: 20 }).withMessage("Contact number too long"),
  handleValidationErrors,
  async (req, res) => {
    logger.info("[UPDATE-DETAILS] Incoming request from %s", req.ip);

    const { address, contactNumber } = req.body;

    try {
      // 1️⃣ Get token from header
      const token = req.headers.authorization?.split(" ")[1];
      
      if (!token) {
        logger.warn("[UPDATE-DETAILS] No token provided from %s", req.ip);
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      // 2️⃣ Verify token
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
        logger.info("[UPDATE-DETAILS] Token verified for userId=%s", decoded.userId);
      } catch (error) {
        logger.warn("[UPDATE-DETAILS] Invalid token from %s", req.ip);
        return res.status(401).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      // 3️⃣ Find user and check role
      const user = await User.findById(decoded.userId);
      if (!user) {
        logger.warn("[UPDATE-DETAILS] User not found userId=%s", decoded.userId);
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // 4️⃣ Check if user has allowed role
      if (!ALLOWED_ROLES.includes(user.role)) {
        logger.warn("[UPDATE-DETAILS] Unauthorized role access for userId=%s role=%s", decoded.userId, user.role);
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update profile",
        });
      }

      // 5️⃣ Update address if provided
      if (address !== undefined) {
        user.address = sanitizeInput.removeXSS(address.trim());
      }

      // 6️⃣ Update contact number if provided
      if (contactNumber !== undefined) {
        user.contactNumber = sanitizeInput.removeXSS(contactNumber.trim());
      }

      await user.save();

      logger.info("✅ [UPDATE-DETAILS] Details updated for user=%s userId=%s", user.email, user._id);

      res.status(200).json({
        success: true,
        message: "Profile details updated successfully",
        user: {
          fullname: user.fullname,
          email: user.email,
          role: user.role,
          address: user.address,
          contactNumber: user.contactNumber,
        },
      });
    } catch (error) {
      logger.error("[UPDATE-DETAILS] Error: %o", error);
      sendSafeError(res, 500, "Error updating profile details", process.env.NODE_ENV === "development");
    }
  }
);

export default router;
