import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import logger, { scrub } from "../logger.js";
import { body } from "express-validator";
import { validationSchemas, handleValidationErrors, sanitizeInput, sendSafeError } from "../middleware/validation.js";

const router = express.Router();

// 🧩 SIGNUP Route
router.post(
  "/signup",
  // Input validation
  validationSchemas.email,
  validationSchemas.password,
  validationSchemas.fullname,
  validationSchemas.role,
  handleValidationErrors,
  async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;

    logger.info("[SIGNUP] Signup request received for email=%s from %s", email, req.ip);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn("[SIGNUP] User already exists email=%s", email);
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Validate role (sanitized by express-validator)
    const allowedRoles = ["SUPER_ADMIN", "admin", "encoder", "researcher"];
    const assignedRole = allowedRoles.includes(role) ? role : "researcher";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with sanitized input
    const newUser = new User({
      fullname: sanitizeInput.removeXSS(fullname),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
    });
    await newUser.save();

    logger.info("[SIGNUP] User registered email=%s userId=%s", newUser.email, newUser._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    logger.error("[SIGNUP] Signup error: %o", error);
    sendSafeError(res, 500, "Server error", process.env.NODE_ENV === "development");
  }
});

export default router;
