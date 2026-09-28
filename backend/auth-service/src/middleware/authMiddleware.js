import { verifyToken } from '../utils/jwt.js';

export const authenticate = (req, res, next) => {
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';
  const providedInternalSecret = req.headers['x-internal-service-secret'];

  // 1. If routed via API Gateway with trusted identity headers
  if (providedInternalSecret && providedInternalSecret === internalSecret) {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    const referenceId = req.headers['x-user-reference-id'];

    if (userId && role) {
      req.user = { userId, role, referenceId };
      return next();
    }
  }

  // 2. Direct Authorization Bearer JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError'
      ? 'Authentication token has expired'
      : 'Invalid authentication token';
    return res.status(401).json({
      success: false,
      message,
    });
  }
};
