import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';
  const providedInternalSecret = req.headers['x-internal-service-secret'];

  // 1. Trusted headers injected by API Gateway
  if (providedInternalSecret && providedInternalSecret === internalSecret) {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    const referenceId = req.headers['x-user-reference-id'];
    const hospitalId = req.headers['x-user-hospital-id'];
    const departmentId = req.headers['x-user-department-id'];

    if (userId && role) {
      req.user = {
        userId,
        role,
        referenceId: referenceId || null,
        familyId: role === 'FAMILY' ? referenceId : null,
        doctorId: role === 'DOCTOR' ? referenceId : null,
        hospitalId: role === 'HOSPITAL_ADMIN' ? referenceId : (hospitalId || null),
        departmentId: departmentId || null,
      };
      return next();
    }
  }

  // 2. Direct Bearer JWT token (standalone, test, or direct invocation)
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
      familyId: decoded.role === 'FAMILY' ? (decoded.referenceId || decoded.familyId) : null,
      doctorId: decoded.role === 'DOCTOR' ? (decoded.referenceId || decoded.doctorId) : null,
      hospitalId: decoded.role === 'HOSPITAL_ADMIN' ? (decoded.referenceId || decoded.hospitalId) : (decoded.hospitalId || null),
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

  // Check Gateway trusted headers first
  if (providedInternalSecret && providedInternalSecret === internalSecret) {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    const referenceId = req.headers['x-user-reference-id'];
    const hospitalId = req.headers['x-user-hospital-id'];
    const departmentId = req.headers['x-user-department-id'];

    if (userId && role) {
      req.user = {
        userId,
        role,
        referenceId: referenceId || null,
        familyId: role === 'FAMILY' ? referenceId : null,
        doctorId: role === 'DOCTOR' ? referenceId : null,
        hospitalId: role === 'HOSPITAL_ADMIN' ? referenceId : (hospitalId || null),
        departmentId: departmentId || null,
      };
      return next();
    }
  }

  // Check Bearer JWT token if present
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      referenceId: decoded.referenceId || null,
      familyId: decoded.role === 'FAMILY' ? (decoded.referenceId || decoded.familyId) : null,
      doctorId: decoded.role === 'DOCTOR' ? (decoded.referenceId || decoded.doctorId) : null,
      hospitalId: decoded.role === 'HOSPITAL_ADMIN' ? (decoded.referenceId || decoded.hospitalId) : (decoded.hospitalId || null),
      departmentId: decoded.departmentId || null,
    };
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token',
    });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: requires one of [${roles.join(', ')}]`,
      });
    }

    next();
  };
};
