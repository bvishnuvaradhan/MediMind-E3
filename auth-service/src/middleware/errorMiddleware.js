export class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = err.errors || undefined;

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || "field";
    message = `User with this ${field} already exists`;
    errors = { [field]: `${field} must be unique` };
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = "Validation failed";
    errors = {};
    for (const key in err.errors) {
      errors[key] = err.errors[key].message;
    }
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token has expired";
  }

  const response = {
    success: false,
    message,
    ...(errors ? { errors } : {}),
  };

  // Log server errors, never log passwords or secrets
  if (statusCode >= 500) {
    console.error(`[auth-service] Server Error: ${err.message}`, err.stack);
  }

  res.status(statusCode).json(response);
};
