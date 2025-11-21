import { body, param, validationResult } from "express-validator";
import logger from "../logger.js";

/**
 * Validation schemas for common fields
 */
export const validationSchemas = {
  // Email validation
  email: body("email")
    .trim()
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail()
    .toLowerCase(),

  // Password validation (minimum 8 chars, strong)
  password: body("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage("Password must contain uppercase, lowercase, number, and special character"),

  // Fullname validation
  fullname: body("fullname")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters, spaces, hyphens, and apostrophes"),

  // Role validation (enum)
  role: body("role")
    .optional()
    .isIn(["SUPER_ADMIN", "admin", "encoder", "researcher"])
    .withMessage("Invalid role specified"),

  // MongoDB ObjectId validation (for 'id' param)
  mongoId: param("id")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid ID format"),

  // MongoDB ObjectId validation (for 'userId' param)
  mongoIdUserId: param("userId")
    .matches(/^[0-9a-fA-F]{24}$/)
    .withMessage("Invalid ID format"),

  // Marker coordinates (latitude/longitude)
  latitude: body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  longitude: body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  // Survey fields
  surveyName: body("surveyName")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Survey name must be 1-255 characters"),

  radioValue: body("radioOne")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Radio value must be under 255 characters"),

  lineLength: body("lineLength")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Line length must be a positive number"),

  // Event fields
  eventTitle: body("title")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Event title must be 1-255 characters"),

  eventDescription: body("description")
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage("Description must be under 5000 characters"),

  eventDate: body("date")
    .isISO8601()
    .withMessage("Event date must be a valid ISO 8601 date"),
};

/**
 * Middleware to handle validation errors
 * Call this after running validation chains
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn("[VALIDATION] Request validation failed for %s %s: %o", req.method, req.originalUrl, errors.array());

    // Return sanitized error messages (don't leak internal details)
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }

  next();
};

/**
 * Sanitization helpers to remove/escape dangerous characters
 */
export const sanitizeInput = {
  /**
   * Remove potential XSS payloads
   */
  removeXSS: (input) => {
    if (typeof input !== "string") return input;
    return input
      .replace(/[<>\"'`]/g, "") // Remove HTML special chars
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, ""); // Remove event handlers
  },

  /**
   * Escape HTML entities to prevent XSS in responses
   */
  escapeHtml: (input) => {
    if (typeof input !== "string") return input;
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return input.replace(/[&<>"']/g, (char) => map[char]);
  },

  /**
   * Sanitize object recursively
   */
  sanitizeObject: (obj) => {
    if (typeof obj !== "object" || obj === null) return obj;

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === "string") {
          sanitized[key] = sanitizeInput.removeXSS(obj[key]);
        } else if (typeof obj[key] === "object") {
          sanitized[key] = sanitizeInput.sanitizeObject(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
    }

    return sanitized;
  },
};

/**
 * Safe error response (don't leak stack traces or internal paths)
 */
export const sendSafeError = (res, statusCode, message, isDevelopment = false) => {
  const response = {
    success: false,
    message: message || "An error occurred",
  };

  // Only include stack trace in development
  if (isDevelopment && message.stack) {
    response.stack = message.stack;
  }

  res.status(statusCode).json(response);
};
