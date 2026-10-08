import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

// Generate or preserve request correlation ID
export const correlationIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'] || req.headers['x-correlation-id'];
  const requestId = incomingId || `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  req.requestId = requestId;
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  next();
};

// Reject and strip browser-supplied spoofed identity headers
export const sanitizeIdentityHeaders = (req, res, next) => {
  delete req.headers['x-user-id'];
  delete req.headers['x-user-role'];
  delete req.headers['x-user-reference-id'];
  delete req.headers['x-family-id'];
  delete req.headers['x-user-family-id'];
  delete req.headers['x-doctor-id'];
  delete req.headers['x-user-doctor-id'];
  delete req.headers['x-department-id'];
  delete req.headers['x-user-department-id'];
  delete req.headers['x-hospital-id'];
  delete req.headers['x-user-hospital-id'];
  delete req.headers['x-member-id'];
  delete req.headers['x-internal-service-secret'];

  next();
};

// Rate limiter for authentication attempts
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : (process.env.AUTH_RATE_LIMIT_MAX ? parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) : 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 1 minute.',
  },
});
