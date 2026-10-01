import { errorResponse } from '../utils/responseEnvelope.js';

export const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
};

export const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    return errorResponse(res, statusCode, 'Validation Error', errors);
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for parameter: ${err.path}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value entered for field: ${field}`;
  }

  return errorResponse(res, statusCode, message);
};
