import User from '../models/User.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

export const authService = {
  async login(email, password) {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    if (user.status !== 'ACTIVE') {
      const err = new Error('Account is inactive or suspended');
      err.statusCode = 403;
      throw err;
    }

    user.last_login_at = new Date();
    await user.save();

    const familyId = user.family_id || (user.role === 'FAMILY' ? 'FAM-001' : undefined);
    const doctorId = user.doctor_id || undefined;
    const departmentId = user.department_id || undefined;
    const hospitalId = user.hospital_id || undefined;

    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      referenceId: user.reference_id ? user.reference_id.toString() : user._id.toString(),
      familyId,
      doctorId,
      departmentId,
      hospitalId,
    };

    const token = generateToken(tokenPayload);

    return {
      token,
      user: {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        accountType: user.account_type,
        referenceId: user.reference_id ? user.reference_id.toString() : user._id.toString(),
        familyId: user.family_id || (user.role === 'FAMILY' ? 'FAM-001' : null),
        doctorId: user.doctor_id || null,
        departmentId: user.department_id || null,
        hospitalId: user.hospital_id || null,
      },
    };
  },

  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      accountType: user.account_type,
      referenceId: user.reference_id ? user.reference_id.toString() : user._id.toString(),
      familyId: user.family_id || (user.role === 'FAMILY' ? 'FAM-001' : null),
      doctorId: user.doctor_id || null,
      departmentId: user.department_id || null,
      hospitalId: user.hospital_id || null,
    };
  },

  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      const err = new Error('Current password and new password are required');
      err.statusCode = 400;
      throw err;
    }

    if (newPassword.length < 6) {
      const err = new Error('New password must be at least 6 characters long');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await verifyPassword(currentPassword, user.password_hash);
    if (!isMatch) {
      const err = new Error('Current password is incorrect');
      err.statusCode = 400;
      throw err;
    }

    user.password_hash = await hashPassword(newPassword);
    await user.save();

    return true;
  },

  async createUser(userData) {
    const { email, password, role, accountType, referenceId, status } = userData;

    if (!email || !password || !role) {
      const err = new Error('Email, password, and role are required');
      err.statusCode = 400;
      throw err;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      const err = new Error('User with this email already exists');
      err.statusCode = 409;
      throw err;
    }

    const password_hash = await hashPassword(password);

    // Map role to account_type if not provided
    const resolvedAccountType = accountType || `${role}_ACCOUNT`;

    const newUser = await User.create({
      email: email.toLowerCase().trim(),
      password_hash,
      role,
      account_type: resolvedAccountType,
      reference_id: referenceId || null,
      status: status || 'ACTIVE',
    });

    return {
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      accountType: newUser.account_type,
      referenceId: newUser.reference_id ? newUser.reference_id.toString() : newUser._id.toString(),
      status: newUser.status,
    };
  },
};
