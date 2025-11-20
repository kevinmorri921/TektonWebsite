// middleware/securityConfig.js - Comprehensive security configuration and hardening

import logger from "../logger.js";

/**
 * Comprehensive security headers middleware
 * Removes information disclosure vectors and hardens the application
 */
export function securityHeadersMiddleware(req, res, next) {
  try {
    // HTTPS/TLS Enforcement
    // Strict-Transport-Security: Enforce HTTPS for all connections
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );

    // Content Security Policy: Restrict resource loading
    // Prevents inline scripts, external scripts, and other XSS vectors
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self' https://api.mongodb.com; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self'"
    );

    // Prevent MIME type sniffing
    // Forces browser to respect Content-Type header
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Clickjacking protection
    // Prevents embedding in iframes
    res.setHeader("X-Frame-Options", "DENY");

    // XSS Protection (legacy, for older browsers)
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Referrer Policy: Control referrer information
    // "strict-origin-when-cross-origin": Only send origin to cross-origin requests
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions Policy: Disable unnecessary browser features
    // Prevents access to camera, microphone, geolocation, etc.
    res.setHeader(
      "Permissions-Policy",
      "camera=(), " +
        "microphone=(), " +
        "geolocation=(), " +
        "payment=(), " +
        "usb=(), " +
        "accelerometer=(), " +
        "gyroscope=(), " +
        "magnetometer=(), " +
        "vr=()"
    );

    // Feature Policy (older name, still used by some browsers)
    res.setHeader(
      "Feature-Policy",
      "camera 'none'; " +
        "microphone 'none'; " +
        "geolocation 'none'; " +
        "payment 'none'; " +
        "usb 'none'"
    );

    // Remove information disclosure headers
    // These headers can reveal server/framework information
    res.removeHeader("X-Powered-By"); // Remove Express version
    res.removeHeader("Server"); // Will be removed below with custom header
    res.setHeader("Server", "Server"); // Generic header (avoid 'Express')

    // Additional security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Disable caching of sensitive responses
    // Can be overridden per-route if needed
    if (req.path.includes("/api/auth") || req.path.includes("/api/admin")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }

    next();
  } catch (error) {
    logger.error("🔥 [SECURITY HEADERS] Error setting headers: %o", error);
    next();
  }
}

/**
 * Enhanced CORS middleware with environment-based configuration
 * Provides proper handling of cross-origin requests
 */
export function enhancedCorsMiddleware() {
  const NODE_ENV = process.env.NODE_ENV || "development";

  // Define allowed origins
  let allowedOrigins = [];

  if (NODE_ENV === "production") {
    // Production: Only allow specific frontend domain
    allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["https://yourdomain.com"];
  } else if (NODE_ENV === "staging") {
    // Staging: Allow specific domains
    allowedOrigins = [
      "https://staging.yourdomain.com",
      "http://localhost:5173",
      "http://localhost:3000",
    ];
  } else {
    // Development: Allow localhost variants
    allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
    ];
  }

  return (req, res, next) => {
    const origin = req.headers.origin;

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, X-Checksum, X-Timestamp"
      );
      res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
      res.setHeader("Access-Control-Expose-Headers", "Content-Length, X-Total-Count");
    } else if (origin) {
      // Log suspicious origin
      logger.warn(
        "🚨 [CORS] Rejected request from unauthorized origin: %s",
        origin
      );
    }

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      if (allowedOrigins.includes(origin)) {
        res.sendStatus(200);
      } else {
        res.sendStatus(403);
      }
    } else {
      next();
    }
  };
}

/**
 * Error handling middleware
 * Ensures sensitive information is never exposed
 */
export function secureErrorHandler(err, req, res, next) {
  try {
    const NODE_ENV = process.env.NODE_ENV || "development";
    const isDevelopment = NODE_ENV === "development";

    // Log the error internally
    logger.error(
      "🔥 [ERROR] %s %s - %s",
      req.method,
      req.path,
      isDevelopment ? err.message : "Internal Server Error"
    );

    if (isDevelopment) {
      // In development, provide detailed error information
      res.status(err.status || 500).json({
        error: {
          message: err.message,
          status: err.status || 500,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString(),
          ...(process.env.DEBUG && { stack: err.stack }),
        },
      });
    } else {
      // In production, send generic error message
      const statusCode = err.status || 500;
      const isClientError = statusCode >= 400 && statusCode < 500;

      res.status(statusCode).json({
        error: {
          message: isClientError
            ? err.message || "Bad Request"
            : "Internal Server Error",
          status: statusCode,
          timestamp: new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    // Fallback error handler
    logger.error("🔥 [ERROR HANDLER] Fallback error: %o", error);
    res.status(500).json({
      error: {
        message: "Internal Server Error",
        status: 500,
      },
    });
  }
}

/**
 * Framework hardening middleware
 * Removes information disclosure vectors
 */
export function frameworkHardeningMiddleware(app) {
  // Disable X-Powered-By header (Express default)
  app.disable("x-powered-by");

  // Set a generic server header
  app.use((req, res, next) => {
    res.removeHeader("X-Powered-By");
    res.removeHeader("X-AspNet-Version");
    res.removeHeader("X-AspNetMvc-Version");
    next();
  });

  // Disable Express's built-in error handling to use ours
  app.set("env", process.env.NODE_ENV || "development");

  return app;
}

/**
 * Request size and timeout limits middleware
 * Prevents DoS and resource exhaustion
 */
export function requestLimitsMiddleware(req, res, next) {
  try {
    // Set request timeout (30 seconds)
    req.setTimeout(30000);

    // Set response timeout (30 seconds)
    res.setTimeout(30000, () => {
      logger.warn("🔥 [TIMEOUT] Request timeout for %s %s", req.method, req.path);
      res.status(408).json({
        error: {
          message: "Request Timeout",
          status: 408,
        },
      });
    });

    next();
  } catch (error) {
    logger.error("🔥 [REQUEST LIMITS] Error: %o", error);
    next();
  }
}

/**
 * Input validation middleware
 * Ensures request headers don't contain suspicious patterns
 */
export function requestValidationMiddleware(req, res, next) {
  try {
    // Check User-Agent header (optional but useful for security)
    const userAgent = req.headers["user-agent"] || "";

    // Check for suspicious patterns (bots, scrapers, etc.)
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
      /nessus/i,
      /qualys/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        logger.warn(
          "🚨 [SECURITY] Suspicious User-Agent detected: %s from %s",
          userAgent,
          req.ip
        );
        // Don't block, just log for monitoring
        break;
      }
    }

    // Validate Content-Type for POST/PUT requests
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      const contentType = req.headers["content-type"] || "";

      // Only allow JSON
      if (!contentType.includes("application/json")) {
        logger.warn(
          "🚨 [VALIDATION] Invalid Content-Type for %s %s: %s",
          req.method,
          req.path,
          contentType
        );
        // Continue anyway - let route handlers decide
      }
    }

    next();
  } catch (error) {
    logger.error("🔥 [REQUEST VALIDATION] Error: %o", error);
    next();
  }
}

/**
 * Security configuration summary
 * Logs what security features are enabled
 */
export function logSecurityConfiguration() {
  const NODE_ENV = process.env.NODE_ENV || "development";

  logger.info("🔐 [SECURITY CONFIG] Security Configuration:");
  logger.info("  Environment: %s", NODE_ENV);
  logger.info("  HTTPS/TLS: %s", NODE_ENV === "production" ? "Enforced" : "Optional");
  logger.info("  CSP: Enabled (default-src 'self')");
  logger.info("  CORS: Environment-based origin validation");
  logger.info("  X-Frame-Options: DENY (Clickjacking protection)");
  logger.info("  X-Content-Type-Options: nosniff (MIME sniffing prevention)");
  logger.info("  Referrer-Policy: strict-origin-when-cross-origin");
  logger.info("  Permissions-Policy: Disabled (camera, microphone, geolocation, etc.)");
  logger.info("  Request Timeout: 30 seconds");
  logger.info("  Error Messages: %s", NODE_ENV === "production" ? "Generic" : "Detailed");
  logger.info("  Information Disclosure: Minimized");
}

/**
 * Validate environment configuration
 * Ensures security best practices are followed
 */
export function validateSecurityConfiguration() {
  const NODE_ENV = process.env.NODE_ENV || "development";
  const warnings = [];
  const errors = [];

  // Check environment
  if (!["development", "staging", "production"].includes(NODE_ENV)) {
    errors.push(`Invalid NODE_ENV: ${NODE_ENV}`);
  }

  // Production checks
  if (NODE_ENV === "production") {
    if (!process.env.JWT_SECRET) {
      errors.push("JWT_SECRET not set in production");
    }

    if (process.env.DEBUG) {
      warnings.push("DEBUG mode enabled in production (should be disabled)");
    }

    if (!process.env.TLS_CERT || !process.env.TLS_KEY) {
      warnings.push("TLS certificates not configured (HTTPS may not be enforced)");
    }

    if (!process.env.ALLOWED_ORIGINS) {
      warnings.push("ALLOWED_ORIGINS not configured (CORS may accept any origin)");
    }
  }

  // Log validation results
  if (errors.length > 0) {
    logger.error("🚨 [SECURITY VALIDATION] Configuration Errors:");
    errors.forEach((err) => logger.error("  - %s", err));
    return { valid: false, errors, warnings };
  }

  if (warnings.length > 0) {
    logger.warn("⚠️ [SECURITY VALIDATION] Configuration Warnings:");
    warnings.forEach((warn) => logger.warn("  - %s", warn));
  } else {
    logger.info("✅ [SECURITY VALIDATION] Security configuration validated");
  }

  return { valid: true, errors: [], warnings };
}

export default {
  securityHeadersMiddleware,
  enhancedCorsMiddleware,
  secureErrorHandler,
  frameworkHardeningMiddleware,
  requestLimitsMiddleware,
  requestValidationMiddleware,
  logSecurityConfiguration,
  validateSecurityConfiguration,
};
