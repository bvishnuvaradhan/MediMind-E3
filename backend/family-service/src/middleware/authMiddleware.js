import jwt from 'jsonwebtoken';

export const authenticateFamily = (req, res, next) => {
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';
  const providedInternalSecret = req.headers['x-internal-service-secret'];

  // 1. If routed via API Gateway with internal secret and trusted headers
  if (providedInternalSecret && providedInternalSecret === internalSecret) {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    const referenceId = req.headers['x-user-reference-id'];

    if (userId && role) {
      if (role !== 'FAMILY') {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: insufficient role permissions',
        });
      }

      req.user = {
        userId,
        role,
        referenceId: referenceId || null,
      };
      return next();
    }
  }

  // 2. Direct Bearer JWT (for standalone testing / direct invocation)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

  try {
    const decoded = jwt.verify(token, secret);

    if (decoded.role !== 'FAMILY') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: insufficient role permissions',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError'
      ? 'Authentication token has expired'
      : 'Invalid or expired authentication token';

    return res.status(401).json({
      success: false,
      message,
    });
  }
};
