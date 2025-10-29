// routes/update-profile.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("🟡 [UPDATE-PROFILE] Incoming request");

  const { fullname } = req.body;

  try {
    // 1️⃣ Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      console.log("🔴 [UPDATE-PROFILE] No token provided");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // 2️⃣ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("🟢 [UPDATE-PROFILE] Token verified for user ID:", decoded.id);
    } catch (error) {
      console.log("🔴 [UPDATE-PROFILE] Invalid token");
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // 3️⃣ Validate request body
    if (!fullname || fullname.trim() === "") {
      console.log("🔴 [UPDATE-PROFILE] Missing fullname");
      return res.status(400).json({
        success: false,
        message: "Fullname is required",
      });
    }

    // 4️⃣ Find user and update
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("🔴 [UPDATE-PROFILE] User not found");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 5️⃣ Update user name
    user.fullname = fullname.trim();
    await user.save();

    console.log("✅ [UPDATE-PROFILE] Name updated successfully for:", user.email);

    // 6️⃣ Success response
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      fullname: user.fullname,
    });

  } catch (error) {
    console.error("🔥 [UPDATE-PROFILE] Server error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;