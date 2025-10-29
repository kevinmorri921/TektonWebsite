// routes/delete-account.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";

const router = express.Router();

router.delete("/", async (req, res) => {
  console.log("🟡 [DELETE-ACCOUNT] Incoming request");

  try {
    // 1️⃣ Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      console.log("🔴 [DELETE-ACCOUNT] No token provided");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 2️⃣ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("🟢 [DELETE-ACCOUNT] Token verified for user ID:", decoded.id);
    } catch (error) {
      console.log("🔴 [DELETE-ACCOUNT] Invalid token");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // 3️⃣ Find and delete user
    const user = await User.findByIdAndDelete(decoded.id);
    
    if (!user) {
      console.log("🔴 [DELETE-ACCOUNT] User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("✅ [DELETE-ACCOUNT] Account deleted successfully for:", user.email);

    // 4️⃣ Success response
    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });

  } catch (error) {
    console.error("🔥 [DELETE-ACCOUNT] Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;