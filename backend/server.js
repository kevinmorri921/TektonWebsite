import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import logger, { scrub } from "./logger.js";

import authRoutes from "./routes/auth.js";
import loginRoute from "./routes/login.js";
import logoutRoute from "./routes/logout.js";
import markerRoutes from "./routes/markerRoutes.js";
import changePasswordRoute from "./routes/change-password.js";
import updateProfileRoute from "./routes/update-profile.js";
import updateUserDetailsRoute from "./routes/update-user-details.js";
import userProfileRoute from "./routes/user-profile.js";
import deleteAccountRoute from "./routes/delete-account.js";
import eventRoutes from "./routes/eventRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import activityLogRoutes from "./routes/activityLogRoutes.js";
import systemInfoRoutes from "./routes/system-info.js";

// Import security and integrity middleware
import { integrityMiddleware, checksumValidation } from "./middleware/dataIntegrity.js";
import { logDependencyAudit, checkForDangerousFunctions } from "./middleware/dependencyManagement.js";
import { ensureUploadDir } from "./middleware/fileUpload.js";
import {
  securityHeadersMiddleware,
  enhancedCorsMiddleware,
  frameworkHardeningMiddleware,
  requestLimitsMiddleware,
  requestValidationMiddleware,
  logSecurityConfiguration,
  validateSecurityConfiguration,
  secureErrorHandler,
} from "./middleware/securityConfig.js";

// Load environment variables
dotenv.config();

// Initialize express
const app = express();

// 🔐 SECURITY: Apply framework hardening
frameworkHardeningMiddleware(app);

// 🧠 Connect to MongoDB
connectDB();

// 🔐 SECURITY: Validate dependencies and integrity on startup
logger.info("🔍 [STARTUP] Validating dependencies and integrity...");
logDependencyAudit();
const dangerousCheck = checkForDangerousFunctions();
if (!dangerousCheck.safe) {
  logger.error(
    "🚨 [STARTUP] Found dangerous functions in codebase: %o",
    dangerousCheck.files
  );
  process.exit(1);
}
logger.info("✅ [STARTUP] Dependency audit complete - safe to proceed");

// 🔐 SECURITY: Ensure upload directory exists
ensureUploadDir();
logger.info("✅ [STARTUP] Upload directory ready");

// 🔐 SECURITY: Validate security configuration
const configValidation = validateSecurityConfiguration();
if (!configValidation.valid) {
  logger.error("🚨 [STARTUP] Security configuration invalid - exiting");
  process.exit(1);
}

// 🔐 SECURITY: Log security configuration
logSecurityConfiguration();

// 🧰 Middleware

// 🔐 Enable compression for all responses (improves ngrok performance)
app.use(compression());

// 🔐 CORS with environment-based configuration
app.use(enhancedCorsMiddleware());

// 🔐 Request size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 🔐 Request validation and security
app.use(requestValidationMiddleware);

// 🔐 Security headers (comprehensive hardening)
app.use(securityHeadersMiddleware);

// 🔐 Request timeouts
app.use(requestLimitsMiddleware);

// 🔐 Security middleware for data integrity
app.use(integrityMiddleware);

// Simple request logger (don't log sensitive fields)
app.use((req, res, next) => {
  const safeBody = scrub(req.body);
  logger.info("Incoming request %s %s %o", req.method, req.originalUrl, safeBody);
  next();
});

// 🛣 API Routes
app.use("/api", authRoutes);
app.use("/api/login", loginRoute);
app.use("/api/logout", logoutRoute);
app.use("/api/markers", markerRoutes);
app.use("/api/auth/change-password", changePasswordRoute);
app.use("/api/auth/update-profile", updateProfileRoute);
app.use("/api/auth/update-user-details", updateUserDetailsRoute);
app.use("/api/auth/user-profile", userProfileRoute);
app.use("/api/auth/delete-account", deleteAccountRoute);
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/activity-log", activityLogRoutes);
app.use("/api/system-info", systemInfoRoutes);

// 🧾 Root route (for testing)
app.get("/", (req, res) => {
  res.send("✅ Backend is running successfully with MongoDB & Marker API!");
});

// Health endpoint for monitoring
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// 🔐 SECURITY: 404 handler (before error handler)
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: "Not Found",
      status: 404,
      timestamp: new Date().toISOString(),
    },
  });
});

// 🔐 SECURITY: Global error handler (must be last)
app.use(secureErrorHandler);

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
const HOST = "0.0.0.0"; // Bind to all interfaces (supports ngrok, Docker, etc.)

// Log startup configuration
logger.info(`🔧 [STARTUP] Environment: ${NODE_ENV}`);
logger.info(`🔧 [STARTUP] Port: ${PORT}`);
logger.info(`🔧 [STARTUP] Host: ${HOST}`);

// Check for required environment variables
const requiredEnvVars = ["JWT_SECRET", "MONGO_URI"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error("🚨 [STARTUP] FATAL: Missing required environment variables: %s", missingEnvVars.join(", "));
  process.exit(1);
}
logger.info("✅ [STARTUP] All required environment variables present");

// Load TLS certificates if in production or if provided
let server;
if (NODE_ENV === "production" || (process.env.TLS_CERT && process.env.TLS_KEY)) {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const certPath = process.env.TLS_CERT || path.join(__dirname, "..", "certs", "server.crt");
    const keyPath = process.env.TLS_KEY || path.join(__dirname, "..", "certs", "server.key");

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const cert = fs.readFileSync(certPath);
      const key = fs.readFileSync(keyPath);
      server = https.createServer({ cert, key }, app);
      logger.info("🔒 HTTPS/TLS enabled");
    } else {
      logger.warn("TLS certificates not found at expected paths. Running HTTP (dev mode).");
      server = app;
    }
  } catch (err) {
    logger.error("Error loading TLS certificates: %o", err);
    server = app;
  }
} else {
  server = app;
}

server.listen(PORT, HOST, () => {
  const protocol = server instanceof https.Server ? "https" : "http";
  logger.info(`🚀 [STARTUP] Server listening on ${protocol}://${HOST}:${PORT}`);
  logger.info(`🚀 [STARTUP] Local access: ${protocol}://localhost:${PORT}`);
  if (process.env.NGROK_URL) {
    logger.info(`🌐 [STARTUP] Public ngrok URL: ${process.env.NGROK_URL}`);
  }
});

// Global error handlers for monitoring
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection:", reason);
});
