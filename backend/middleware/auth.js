import jwt from "jsonwebtoken";
import User from "../models/user.js";
import logger, { scrub } from "../logger.js";

const JWT_SECRET = process.env.JWT_SECRET || "devSecretKey123";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("[AUTH] No token provided for request %s %s from %s", req.method, req.originalUrl, req.ip);
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch fresh user data from DB (so role change works instantly)
    const user = await User.findById(decoded.userId);

    if (!user || !user.isEnabled) {
      logger.warn("[AUTH] Disabled or missing account for userId=%s on %s", decoded.userId, req.originalUrl);
      return res.status(403).json({ message: "Account disabled or not found" });
    }

    // Attach user to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,   // IMPORTANT ✔
    };

    next();
  } catch (error) {
    logger.error("[AUTH] Token verification failed for request %s %s: %o", req.method, req.originalUrl, error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default auth;
