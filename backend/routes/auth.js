import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import logger, { scrub } from "../logger.js";

const router = express.Router();

// 🧩 SIGNUP Route
router.post("/signup", async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;

    logger.info("[SIGNUP] Signup request received for email=%s from %s", email, req.ip);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn("[SIGNUP] User already exists email=%s", email);
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Validate role
    const allowedRoles = ["SUPER_ADMIN", "admin", "encoder", "researcher"];
    const assignedRole = allowedRoles.includes(role) ? role : "researcher";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({ fullname, email, password: hashedPassword, role: assignedRole });
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
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
