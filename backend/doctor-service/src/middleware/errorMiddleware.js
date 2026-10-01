export const notFoundHandler = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || (err.name === 'ValidationError' ? 400 : 500);

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: ${err.value}`,
      errors: { [err.path]: 'Invalid ObjectId format' },
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate resource: A doctor with this ${field} already exists.`,
      errors: { [field]: 'Must be unique' },
    });
  }

  if (err.name === 'ValidationError') {
    const errors = {};
    for (const [key, value] of Object.entries(err.errors || {})) {
      errors[key] = value.message;
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      errors,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
