export const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal gateway error";

  if (statusCode >= 500) {
    console.error(`[api-gateway] Error: ${message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors ? { errors: err.errors } : {}),
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found on API Gateway: ${req.method} ${req.originalUrl}`,
  });
};
