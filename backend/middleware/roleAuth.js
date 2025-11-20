import logger from "../logger.js";

export default function roleAuth(allowedRoles = []) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      logger.warn("[ROLE AUTH] Unauthorized access attempt to %s from %s", req.originalUrl, req.ip);
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Allow if user's role is in allowedRoles OR if super_admin
    if (!allowedRoles.includes(user.role) && user.email !== "super_admin@tekton.com") {
      logger.warn("[ROLE AUTH] Access denied for user=%s role=%s route=%s", user.email || user.id, user.role, req.originalUrl);
      return res.status(403).json({ message: "Access denied: insufficient role permissions" });
    }

    next();
  };
}
