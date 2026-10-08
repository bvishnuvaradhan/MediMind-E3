import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';
  const providedInternalSecret = req.headers['x-internal-service-secret'];

  // 1. Trusted headers injected by API Gateway
  if (providedInternalSecret && providedInternalSecret === internalSecret) {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    const referenceId = req.headers['x-user-reference-id'];

    const hospitalId = req.headers['x-user-hospital-id'] || req.headers['x-hospital-id'];

    if (userId && role) {
      req.user = {
        userId,
        role,
        referenceId: referenceId || null,
        hospitalId: role === 'HOSPITAL_ADMIN' ? (hospitalId || referenceId) : null,
      };
      return next();
    }
  }

  // 2. Direct Bearer JWT token (standalone or test invocation)
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
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      referenceId: decoded.referenceId || null,
      hospitalId: decoded.role === 'HOSPITAL_ADMIN' ? (decoded.referenceId || decoded.hospitalId) : null,
      departmentId: decoded.departmentId || null,
    };
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

export const optionalAuth = (req, res, next) => {
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';
  const providedInternalSecret = req.headers['x-internal-service-secret'];

  if (providedInternalSecret && providedInternalSecret === internalSecret) {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    const hospitalId = req.headers['x-user-hospital-id'] || req.headers['x-hospital-id'];
    if (userId && role) {
      req.user = {
        userId,
        role,
        referenceId: referenceId || null,
        hospitalId: role === 'HOSPITAL_ADMIN' ? (hospitalId || referenceId) : null,
      };
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';
    try {
      const decoded = jwt.verify(token, secret);
      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        referenceId: decoded.referenceId || null,
        hospitalId: decoded.role === 'HOSPITAL_ADMIN' ? (decoded.referenceId || decoded.hospitalId) : null,
        departmentId: decoded.departmentId || null,
      };
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: insufficient role permissions',
      });
    }

    next();
  };
};

export const requireChairman = requireRole('CHAIRMAN');

export const requireHospitalAdminOrChairman = requireRole('HOSPITAL_ADMIN', 'CHAIRMAN');

export const requireDeptHeadOrHospitalAdminOrChairman = requireRole('DEPARTMENT_HEAD', 'HOSPITAL_ADMIN', 'CHAIRMAN');
