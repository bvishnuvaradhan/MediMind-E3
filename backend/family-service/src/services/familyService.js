import mongoose from 'mongoose';
import Family from '../models/Family.js';

export const familyService = {
  async createFamily(familyData) {
    const { familyName, email, mobile, creatorUserId } = familyData;

    if (!familyName || !email || !mobile) {
      const err = new Error('Family name, email, and mobile are required');
      err.statusCode = 400;
      throw err;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await Family.findOne({ email: cleanEmail });
    if (existing) {
      const err = new Error('A family account with this email already exists');
      err.statusCode = 409;
      throw err;
    }

    const resolvedCreatorId = creatorUserId
      ? (mongoose.Types.ObjectId.isValid(creatorUserId) ? new mongoose.Types.ObjectId(creatorUserId) : new mongoose.Types.ObjectId())
      : new mongoose.Types.ObjectId();

    const newFamily = await Family.create({
      family_name: familyName.trim(),
      creator_user_id: resolvedCreatorId,
      email: cleanEmail,
      mobile: mobile.trim(),
      status: 'ACTIVE',
    });

    return newFamily.toPublicJSON();
  },

  async getMyFamily(user) {
    if (!user) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    let family = null;

    // 1. Try finding by referenceId (which points to Family _id)
    if (user.referenceId && mongoose.Types.ObjectId.isValid(user.referenceId)) {
      family = await Family.findOne({ _id: user.referenceId, status: { $ne: 'DELETED' } });
    }

    // 2. Fallback to finding by creator_user_id
    if (!family && user.userId && mongoose.Types.ObjectId.isValid(user.userId)) {
      family = await Family.findOne({ creator_user_id: user.userId, status: { $ne: 'DELETED' } });
    }

    if (!family) {
      const err = new Error('Family account not found');
      err.statusCode = 404;
      throw err;
    }

    return family.toPublicJSON();
  },

  async updateMyFamily(user, updateData) {
    if (!user) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    let family = null;

    if (user.referenceId && mongoose.Types.ObjectId.isValid(user.referenceId)) {
      family = await Family.findOne({ _id: user.referenceId, status: { $ne: 'DELETED' } });
    }

    if (!family && user.userId && mongoose.Types.ObjectId.isValid(user.userId)) {
      family = await Family.findOne({ creator_user_id: user.userId, status: { $ne: 'DELETED' } });
    }

    if (!family) {
      const err = new Error('Family account not found');
      err.statusCode = 404;
      throw err;
    }

    // Only the family creator / account owner can update family-level details
    if (family.creator_user_id && user.userId && family.creator_user_id.toString() !== user.userId.toString()) {
      const err = new Error('Access forbidden: only the family account creator can update family details');
      err.statusCode = 403;
      throw err;
    }

    if (updateData.familyName) {
      family.family_name = updateData.familyName.trim();
    }
    if (updateData.mobile) {
      family.mobile = updateData.mobile.trim();
    }

    await family.save();
    return family.toPublicJSON();
  },

  async resolveFamilyIdForUser(user) {
    if (!user) return null;
    if (user.referenceId && mongoose.Types.ObjectId.isValid(user.referenceId)) {
      const family = await Family.findById(user.referenceId);
      if (family) return family._id;
    }
    if (user.userId && mongoose.Types.ObjectId.isValid(user.userId)) {
      const family = await Family.findOne({ creator_user_id: user.userId });
      if (family) return family._id;
    }
    return null;
  },
};
