import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger from "../logger.js";

// JWT_SECRET will be validated when middleware is used (after dotenv.config() in server)
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("FATAL: JWT_SECRET environment variable is not set.");
  }
  return secret;
}

const adminAuth = async (req, res, next) => {
  try {
    const JWT_SECRET = getJWTSecret();
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("[ADMIN AUTH] No token provided for admin route %s %s from %s", req.method, req.originalUrl, req.ip);
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user info from JWT
    req.user = {
      id: decoded.userId,
      role: decoded.role,
    };

    // Optional: Fetch user from DB to verify they still exist or are active
    const userInDb = await User.findById(decoded.userId);
    if (!userInDb || !userInDb.isEnabled) {
      logger.warn("[ADMIN AUTH] Admin access denied - user missing/disabled userId=%s", decoded.userId);
      return res.status(403).json({ message: "User not found or disabled" });
    }

    // Optional: enforce DB role check
    req.user.role = userInDb.role; // always up-to-date from DB

    // Only allow admin access
    const allowedRoles = ["SUPER_ADMIN", "admin"];
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn("[ADMIN AUTH] Access denied for userId=%s role=%s route=%s", req.user.id, req.user.role, req.originalUrl);
      return res.status(403).json({ message: "Admin role required" });
    }

    next();
  } catch (error) {
    logger.error("[ADMIN AUTH] Auth error on %s %s: %o", req.method, req.originalUrl, error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default adminAuth;
