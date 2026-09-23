import jwt from "jsonwebtoken";
import { config } from "../config/services.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required: Missing or invalid Authorization header",
    });
  }

  const token = authHeader.split(" ")[1];
  if (!token || token.trim().length === 0) {
    return res.status(401).json({
      success: false,
      message: "Authentication required: Token is missing",
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;

    // Inject identity headers for downstream microservices
    req.headers["x-user-id"] = decoded.userId || decoded.sub || "";
    req.headers["x-user-role"] = decoded.role || "";
    req.headers["x-reference-id"] = decoded.referenceId || "";
    req.headers["x-family-member-ids"] = JSON.stringify(
      decoded.family_member_ids || []
    );

    // Forward internal service key if configured (allows microservices to verify gateway provenance)
    if (config.internalServiceKey) {
      req.headers["x-internal-service-key"] = config.internalServiceKey;
    }

    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Authentication token has expired"
        : "Invalid authentication token";

    return res.status(401).json({
      success: false,
      message,
    });
  }
};
