import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import winston from "winston";

const { combine, timestamp, printf, errors, splat, colorize } = winston.format;

// ensure log directory exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp(), errors({ stack: true }), splat(), logFormat),
  transports: [
    new winston.transports.File({ filename: path.join(logDir, "error.log"), level: "error" }),
    new winston.transports.File({ filename: path.join(logDir, "combined.log") }),
  ],
});

// Also log to console during development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), errors({ stack: true }), splat(), logFormat),
    })
  );
}

// Helper to remove sensitive fields from objects before logging
function scrub(obj = {}) {
  try {
    const copy = JSON.parse(JSON.stringify(obj));
    if (copy.password) copy.password = "[REDACTED]";
    if (copy.oldPassword) copy.oldPassword = "[REDACTED]";
    if (copy.newPassword) copy.newPassword = "[REDACTED]";
    return copy;
  } catch (e) {
    return obj;
  }
}

export { logger as default, scrub };
