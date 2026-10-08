import jwt from 'jsonwebtoken';

export const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;

    // Inject trusted identity headers for downstream microservices
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-user-reference-id'] = decoded.referenceId || '';
    if (decoded.familyId) {
      req.headers['x-family-id'] = decoded.familyId;
      req.headers['x-user-family-id'] = decoded.familyId;
    }
    if (decoded.doctorId) {
      req.headers['x-doctor-id'] = decoded.doctorId;
      req.headers['x-user-doctor-id'] = decoded.doctorId;
    }
    if (decoded.departmentId) {
      req.headers['x-department-id'] = decoded.departmentId;
      req.headers['x-user-department-id'] = decoded.departmentId;
    }
    if (decoded.hospitalId) {
      req.headers['x-hospital-id'] = decoded.hospitalId;
      req.headers['x-user-hospital-id'] = decoded.hospitalId;
    }
    req.headers['x-internal-service-secret'] = internalSecret;

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

export const optionalJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';
  const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;

    // Inject trusted identity headers for downstream microservices
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-user-reference-id'] = decoded.referenceId || '';
    if (decoded.familyId) {
      req.headers['x-family-id'] = decoded.familyId;
      req.headers['x-user-family-id'] = decoded.familyId;
    }
    if (decoded.doctorId) {
      req.headers['x-doctor-id'] = decoded.doctorId;
      req.headers['x-user-doctor-id'] = decoded.doctorId;
    }
    if (decoded.departmentId) {
      req.headers['x-department-id'] = decoded.departmentId;
      req.headers['x-user-department-id'] = decoded.departmentId;
    }
    if (decoded.hospitalId) {
      req.headers['x-hospital-id'] = decoded.hospitalId;
      req.headers['x-user-hospital-id'] = decoded.hospitalId;
    }
    req.headers['x-internal-service-secret'] = internalSecret;

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
