import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import logger, { scrub } from "./logger.js";

import authRoutes from "./routes/auth.js";
import loginRoute from "./routes/login.js";
import markerRoutes from "./routes/markerRoutes.js";
import changePasswordRoute from "./routes/change-password.js";
import updateProfileRoute from "./routes/update-profile.js";
import deleteAccountRoute from "./routes/delete-account.js";
import eventRoutes from "./routes/eventRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";

// Load environment variables
dotenv.config();

// Initialize express
const app = express();
const PORT = process.env.PORT || 5000;

// 🧠 Connect to MongoDB
connectDB();

// 🧰 Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // ✅ replaces bodyParser
app.use(express.urlencoded({ extended: true }));

// Simple request logger (don't log sensitive fields)
app.use((req, res, next) => {
  const safeBody = scrub(req.body);
  logger.info("Incoming request %s %s %o", req.method, req.originalUrl, safeBody);
  next();
});

// 🛣 API Routes
app.use("/api", authRoutes);
app.use("/api/login", loginRoute);
app.use("/api/markers", markerRoutes);
app.use("/api/auth/change-password", changePasswordRoute);
app.use("/api/auth/update-profile", updateProfileRoute);
app.use("/api/auth/delete-account", deleteAccountRoute);
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminUserRoutes);

// 🧾 Root route (for testing)
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully with MongoDB & Marker API!");
});

// Health endpoint for monitoring
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// 🚀 Start Server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});

// Global error handlers for monitoring
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});
