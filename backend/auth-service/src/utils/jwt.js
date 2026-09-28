import jwt from 'jsonwebtoken';

export const generateToken = (payload, options = {}) => {
  const secret = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';
  const expiresIn = options.expiresIn || process.env.JWT_EXPIRES_IN || '24h';

  const cleanPayload = {
    userId: payload.userId,
    role: payload.role,
    referenceId: payload.referenceId,
  };

  return jwt.sign(cleanPayload, secret, { expiresIn });
};

export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET || 'medimind_jwt_secret_development_key_change_in_production';
  return jwt.verify(token, secret);
};
