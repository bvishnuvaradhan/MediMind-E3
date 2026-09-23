import mongoose from "mongoose";
import User from "../models/User.js";
import { hashPassword, comparePassword, validatePasswordStrength } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { AppError } from "../middleware/errorMiddleware.js";

const ROLE_ACCOUNT_TYPE_MAP = {
  FAMILY: "FAMILY_ACCOUNT",
  DOCTOR: "DOCTOR_ACCOUNT",
  DEPARTMENT_HEAD: "DEPARTMENT_HEAD_ACCOUNT",
  HOSPITAL_ADMIN: "HOSPITAL_ADMIN_ACCOUNT",
  CHAIRMAN: "CHAIRMAN_ACCOUNT",
};

export class AuthService {
  static async register({
    email,
    password,
    role = "FAMILY",
    referenceId,
    family_member_ids,
  }) {
    if (!email || typeof email !== "string" || email.trim().length === 0) {
      throw new AppError("Email is required", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new AppError("Please provide a valid email address", 400);
    }

    try {
      validatePasswordStrength(password);
    } catch (err) {
      throw new AppError(err.message, 400);
    }

    // Check if role is valid
    const upperRole = role.toUpperCase();
    if (!ROLE_ACCOUNT_TYPE_MAP[upperRole]) {
      throw new AppError(
        `Invalid role: ${role}. Must be one of ${Object.keys(ROLE_ACCOUNT_TYPE_MAP).join(", ")}`,
        400
      );
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Prepare reference_id
    const finalReferenceId = referenceId
      ? new mongoose.Types.ObjectId(referenceId)
      : new mongoose.Types.ObjectId();

    // Prepare account_type
    const accountType = ROLE_ACCOUNT_TYPE_MAP[upperRole];

    // Prepare family_member_ids
    let finalFamilyMemberIds = [];
    if (upperRole === "FAMILY") {
      if (Array.isArray(family_member_ids) && family_member_ids.length > 0) {
        finalFamilyMemberIds = family_member_ids.map(
          (id) => new mongoose.Types.ObjectId(id)
        );
      } else {
        // Default family member ID matches referenceId for primary account holder
        finalFamilyMemberIds = [finalReferenceId];
      }
    }

    // Create user
    const user = await User.create({
      email: normalizedEmail,
      password_hash: passwordHash,
      role: upperRole,
      account_type: accountType,
      reference_id: finalReferenceId,
      family_member_ids: finalFamilyMemberIds,
      status: "ACTIVE",
    });

    const token = generateToken(user);

    return {
      token,
      user: user.toSafeObject(),
    };
  }

  static async login({ email, password }) {
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Protect against timing/enumeration attacks by using consistent message
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Account is suspended or deactivated", 403);
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    // Update last login
    user.last_login_at = new Date();
    await user.save();

    const token = generateToken(user);

    return {
      token,
      user: user.toSafeObject(),
    };
  }

  static async getMe(userId) {
    if (!userId) {
      throw new AppError("User ID is required", 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Account is not active", 403);
    }

    return user.toSafeObject();
  }
}
