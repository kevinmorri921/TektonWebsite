import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger from "../logger.js";

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

// GET user's theme preference
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    logger.info("[THEME] Retrieved theme for user %s: %s", req.userId, user.theme);
    res.json({ success: true, theme: user.theme || "light" });
  } catch (error) {
    logger.error("[THEME] Error retrieving theme: %s", error.message);
    res.status(500).json({ success: false, message: "Error retrieving theme" });
  }
});

// POST/PUT update user's theme preference
router.post("/", verifyToken, async (req, res) => {
  try {
    const { theme } = req.body;

    // Validate theme value
    if (!theme || !["light", "dark"].includes(theme)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid theme. Must be 'light' or 'dark'" 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { theme },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    logger.info("[THEME] Updated theme for user %s to: %s", req.userId, theme);
    res.json({ success: true, theme: user.theme });
  } catch (error) {
    logger.error("[THEME] Error updating theme: %s", error.message);
    res.status(500).json({ success: false, message: "Error updating theme" });
  }
});

export default router;
