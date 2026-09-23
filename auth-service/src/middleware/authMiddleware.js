import { verifyToken } from "../utils/jwt.js";
import { AppError } from "./errorMiddleware.js";

export const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required: Missing or invalid Authorization header", 401);
    }

    const token = authHeader.split(" ")[1];
    if (!token || token.trim().length === 0) {
      throw new AppError("Authentication required: Token is missing", 401);
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    if (error.name === "TokenExpiredError") {
      return next(new AppError("Authentication token has expired", 401));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid authentication token", 401));
    }
    return next(new AppError(`Authentication error: ${error.message}`, 401));
  }
};
