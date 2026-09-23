import jwt from "jsonwebtoken";

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error("JWT_SECRET environment variable is required and must not be empty");
  }
  return secret;
};

export const generateToken = (user) => {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  const userId = user._id ? user._id.toString() : user.userId;
  const referenceId = user.reference_id
    ? user.reference_id.toString()
    : user.referenceId || userId;
  const familyMemberIds = (user.family_member_ids || []).map((id) =>
    id.toString()
  );

  const payload = {
    userId,
    sub: userId,
    role: user.role,
    referenceId,
    family_member_ids: familyMemberIds,
  };

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token) => {
  if (!token) {
    throw new Error("Token is required");
  }
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
};
