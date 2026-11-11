import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/runtimeConfig.js';

export const generateToken = (payload, options = {}) => {
  const secret = getJwtSecret();
  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || '24h';

  const cleanPayload = {
    userId: payload.userId,
    role: payload.role,
    referenceId: payload.referenceId,
    ...(payload.familyId ? { familyId: payload.familyId } : {}),
    ...(payload.doctorId ? { doctorId: payload.doctorId } : {}),
    ...(payload.departmentId ? { departmentId: payload.departmentId } : {}),
    ...(payload.hospitalId ? { hospitalId: payload.hospitalId } : {}),
  };

  return jwt.sign(cleanPayload, secret, { expiresIn });
};

export const verifyToken = (token) => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};
