import jwt from 'jsonwebtoken';
import { getJwtSecret, getInternalServiceSecret } from '../config/runtimeConfig.js';

export const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = getJwtSecret();
  const internalSecret = getInternalServiceSecret();

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
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError'
        ? 'Authentication token has expired. Please re-authenticate.'
        : 'Invalid or expired authentication token.',
    });
  }
};

export const optionalJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const secret = getJwtSecret();
  const internalSecret = getInternalServiceSecret();

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
    // optionalJwt: JWT is optional. If token has expired or is invalid, do not reject with 401; proceed unauthenticated.
    req.user = null;
    return next();
  }
};
