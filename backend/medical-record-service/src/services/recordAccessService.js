import mongoose from 'mongoose';
import RecordAccess from '../models/RecordAccess.js';
import { internalServices } from '../utils/internalServices.js';

export const recordAccessService = {
  /**
   * Check whether a doctor has ACTIVE RecordAccess for a family member
   */
  async hasActiveAccess(doctorId, familyMemberId) {
    if (!doctorId || !familyMemberId) return false;
    const access = await RecordAccess.findOne({
      doctor_id: doctorId,
      family_member_id: familyMemberId,
      status: 'ACTIVE',
    });
    return !!access;
  },

  /**
   * Grant a doctor full medical record access for a family member (FAMILY role only)
   */
  async grantAccess(user, payload) {
    if (user.role !== 'FAMILY') {
      const err = new Error('Access forbidden: only family accounts can grant doctor record access');
      err.statusCode = 403;
      throw err;
    }

    const familyMemberId = payload.familyMemberId || payload.family_member_id;
    const doctorId = payload.doctorId || payload.doctor_id;

    if (!familyMemberId || !doctorId) {
      const err = new Error('familyMemberId and doctorId are required');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(familyMemberId)) {
      const err = new Error('Invalid familyMemberId format');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      const err = new Error('Invalid doctorId format');
      err.statusCode = 400;
      throw err;
    }

    // Verify family owns this family member
    const memberCheck = await internalServices.verifyFamilyMember({ user, memberId: familyMemberId });
    if (!memberCheck.valid) {
      const err = new Error(memberCheck.message || 'Access forbidden: member does not belong to your family');
      err.statusCode = memberCheck.statusCode || 403;
      throw err;
    }

    // Verify doctor exists and is ACTIVE
    const doctor = await internalServices.getDoctor(doctorId);
    if (doctor && doctor.status && doctor.status !== 'ACTIVE') {
      const err = new Error('Cannot grant access to an inactive doctor');
      err.statusCode = 400;
      throw err;
    }

    // Find existing grant or create new one
    let access = await RecordAccess.findOne({
      family_member_id: familyMemberId,
      doctor_id: doctorId,
    });

    if (access) {
      access.status = 'ACTIVE';
      access.granted_by = user.userId;
      access.granted_at = new Date();
      access.revoked_at = null;
      await access.save();
    } else {
      access = await RecordAccess.create({
        family_member_id: familyMemberId,
        doctor_id: doctorId,
        granted_by: user.userId,
        granted_at: new Date(),
        status: 'ACTIVE',
      });
    }

    return access.toPublicJSON();
  },

  /**
   * Get all active doctor accesses for a family member
   */
  async getMemberAccess(user, memberId) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      const err = new Error('Invalid member ID format');
      err.statusCode = 400;
      throw err;
    }

    if (user.role === 'FAMILY') {
      const check = await internalServices.verifyFamilyMember({ user, memberId });
      if (!check.valid) {
        const err = new Error('Access forbidden: member does not belong to your family');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role !== 'CHAIRMAN') {
      const err = new Error('Access forbidden: insufficient role permissions to view member access list');
      err.statusCode = 403;
      throw err;
    }

    const accesses = await RecordAccess.find({
      family_member_id: memberId,
      status: 'ACTIVE',
    }).sort({ granted_at: -1 });

    return accesses.map((a) => a.toPublicJSON());
  },

  /**
   * Revoke doctor access for a family member
   */
  async revokeAccess(user, accessId) {
    if (!mongoose.Types.ObjectId.isValid(accessId)) {
      const err = new Error('Invalid access ID format');
      err.statusCode = 400;
      throw err;
    }

    const access = await RecordAccess.findById(accessId);
    if (!access) {
      const err = new Error('Record access grant not found');
      err.statusCode = 404;
      throw err;
    }

    // Scoping check: only the family account that owns the family member can revoke
    if (user.role === 'FAMILY') {
      const check = await internalServices.verifyFamilyMember({ user, memberId: access.family_member_id });
      if (!check.valid) {
        const err = new Error('Access forbidden: cannot revoke access for a member outside your family');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role !== 'CHAIRMAN') {
      const err = new Error('Access forbidden: only family accounts can revoke doctor record access');
      err.statusCode = 403;
      throw err;
    }

    if (access.status === 'REVOKED') {
      const err = new Error('Record access is already revoked');
      err.statusCode = 400;
      throw err;
    }

    access.status = 'REVOKED';
    access.revoked_at = new Date();
    await access.save();

    return access.toPublicJSON();
  },

  /**
   * Retrieve doctor's record access history
   */
  async getDoctorAccessHistory(user) {
    if (user.role !== 'DOCTOR') {
      const err = new Error('Access forbidden: only doctors can view doctor access history');
      err.statusCode = 403;
      throw err;
    }

    const doctorId = user.doctorId || user.referenceId;
    if (!doctorId) {
      const err = new Error('Doctor profile not linked to user account');
      err.statusCode = 403;
      throw err;
    }

    const history = await RecordAccess.find({
      doctor_id: doctorId,
    }).sort({ granted_at: -1 });

    return history.map((a) => a.toPublicJSON());
  },
};
