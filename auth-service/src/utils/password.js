import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

export const validatePasswordStrength = (password) => {
  if (typeof password !== "string" || password.trim().length === 0) {
    throw new Error("Password must be a non-empty string");
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }
  return true;
};

export const hashPassword = async (password) => {
  validatePasswordStrength(password);
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password, passwordHash) => {
  if (!password || !passwordHash) {
    return false;
  }
  return await bcrypt.compare(password, passwordHash);
};
