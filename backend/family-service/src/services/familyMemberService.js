import mongoose from 'mongoose';
import FamilyMember from '../models/FamilyMember.js';
import Family from '../models/Family.js';
import { familyService } from './familyService.js';

export const familyMemberService = {
  async addMember(user, memberData) {
    const familyId = await familyService.resolveFamilyIdForUser(user);
    if (!familyId) {
      const err = new Error('Family account not found for authenticated user');
      err.statusCode = 404;
      throw err;
    }

    const {
      fullName,
      profilePicture,
      dateOfBirth,
      gender,
      bloodGroup,
      phone,
      email,
      address,
      emergencyContact,
      healthInformation,
      medicalConditions,
      allergies,
      previousTreatments,
    } = memberData;

    if (!fullName || !dateOfBirth || !gender) {
      const err = new Error('Full name, date of birth, and gender are required');
      err.statusCode = 400;
      throw err;
    }

    const validGenders = ['MALE', 'FEMALE', 'OTHER'];
    if (!validGenders.includes(gender.toUpperCase())) {
      const err = new Error(`Gender must be one of: ${validGenders.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    if (bloodGroup) {
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!validBloodGroups.includes(bloodGroup.toUpperCase())) {
        const err = new Error(`Blood group must be one of: ${validBloodGroups.join(', ')}`);
        err.statusCode = 400;
        throw err;
      }
    }

    const newMember = await FamilyMember.create({
      family_id: familyId,
      full_name: fullName.trim(),
      profile_picture: profilePicture || null,
      date_of_birth: new Date(dateOfBirth),
      gender: gender.toUpperCase(),
      blood_group: bloodGroup ? bloodGroup.toUpperCase() : null,
      phone: phone ? phone.trim() : null,
      email: email ? email.toLowerCase().trim() : null,
      address: address || null,
      emergency_contact: emergencyContact || { name: null, relationship: null, phone: null },
      health_information: healthInformation || null,
      medical_conditions: Array.isArray(medicalConditions) ? medicalConditions : [],
      allergies: Array.isArray(allergies) ? allergies : [],
      previous_treatments: Array.isArray(previousTreatments) ? previousTreatments : [],
      status: 'ACTIVE',
    });

    return newMember.toPublicJSON();
  },

  async getMembers(user) {
    const familyId = await familyService.resolveFamilyIdForUser(user);
    if (!familyId) {
      const err = new Error('Family account not found');
      err.statusCode = 404;
      throw err;
    }

    const members = await FamilyMember.find({
      family_id: familyId,
      status: 'ACTIVE',
    }).sort({ created_at: 1 });

    return members.map((m) => m.toPublicJSON());
  },

  async getMemberById(user, memberId) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      const err = new Error('Invalid member ID format');
      err.statusCode = 400;
      throw err;
    }

    const familyId = await familyService.resolveFamilyIdForUser(user);
    if (!familyId) {
      const err = new Error('Family account not found');
      err.statusCode = 404;
      throw err;
    }

    const member = await FamilyMember.findOne({
      _id: memberId,
      status: { $ne: 'REMOVED' },
    });

    if (!member) {
      const err = new Error('Family member not found');
      err.statusCode = 404;
      throw err;
    }

    // Scoping check: verify member belongs to this family
    if (member.family_id.toString() !== familyId.toString()) {
      const err = new Error('Access forbidden: member does not belong to your family');
      err.statusCode = 403;
      throw err;
    }

    return member.toPublicJSON();
  },

  async updateMember(user, memberId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      const err = new Error('Invalid member ID format');
      err.statusCode = 400;
      throw err;
    }

    const familyId = await familyService.resolveFamilyIdForUser(user);
    if (!familyId) {
      const err = new Error('Family account not found');
      err.statusCode = 404;
      throw err;
    }

    const member = await FamilyMember.findOne({
      _id: memberId,
      status: { $ne: 'REMOVED' },
    });

    if (!member) {
      const err = new Error('Family member not found');
      err.statusCode = 404;
      throw err;
    }

    if (member.family_id.toString() !== familyId.toString()) {
      const err = new Error('Access forbidden: member does not belong to your family');
      err.statusCode = 403;
      throw err;
    }

    if (updateData.fullName) member.full_name = updateData.fullName.trim();
    if (updateData.profilePicture !== undefined) member.profile_picture = updateData.profilePicture;
    if (updateData.dateOfBirth) member.date_of_birth = new Date(updateData.dateOfBirth);
    if (updateData.gender) {
      const validGenders = ['MALE', 'FEMALE', 'OTHER'];
      if (!validGenders.includes(updateData.gender.toUpperCase())) {
        const err = new Error(`Gender must be one of: ${validGenders.join(', ')}`);
        err.statusCode = 400;
        throw err;
      }
      member.gender = updateData.gender.toUpperCase();
    }
    if (updateData.bloodGroup !== undefined) {
      if (updateData.bloodGroup) {
        const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (!validBloodGroups.includes(updateData.bloodGroup.toUpperCase())) {
          const err = new Error(`Blood group must be one of: ${validBloodGroups.join(', ')}`);
          err.statusCode = 400;
          throw err;
        }
        member.blood_group = updateData.bloodGroup.toUpperCase();
      } else {
        member.blood_group = null;
      }
    }
    if (updateData.phone !== undefined) member.phone = updateData.phone ? updateData.phone.trim() : null;
    if (updateData.email !== undefined) member.email = updateData.email ? updateData.email.toLowerCase().trim() : null;
    if (updateData.address !== undefined) member.address = updateData.address;
    if (updateData.emergencyContact !== undefined) member.emergency_contact = updateData.emergencyContact;
    if (updateData.healthInformation !== undefined) member.health_information = updateData.healthInformation;
    if (Array.isArray(updateData.medicalConditions)) member.medical_conditions = updateData.medicalConditions;
    if (Array.isArray(updateData.allergies)) member.allergies = updateData.allergies;
    if (Array.isArray(updateData.previousTreatments)) member.previous_treatments = updateData.previousTreatments;

    await member.save();
    return member.toPublicJSON();
  },

  async removeMember(user, memberId) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      const err = new Error('Invalid member ID format');
      err.statusCode = 400;
      throw err;
    }

    const familyId = await familyService.resolveFamilyIdForUser(user);
    if (!familyId) {
      const err = new Error('Family account not found');
      err.statusCode = 404;
      throw err;
    }

    const family = await Family.findById(familyId);
    if (!family) {
      const err = new Error('Family account not found');
      err.statusCode = 404;
      throw err;
    }

    // Only the family creator / account owner can remove a member
    if (family.creator_user_id && user.userId && family.creator_user_id.toString() !== user.userId.toString()) {
      const err = new Error('Only the family creator can remove a family member');
      err.statusCode = 403;
      throw err;
    }

    const member = await FamilyMember.findOne({
      _id: memberId,
      status: { $ne: 'REMOVED' },
    });

    if (!member) {
      const err = new Error('Family member not found');
      err.statusCode = 404;
      throw err;
    }

    if (member.family_id.toString() !== familyId.toString()) {
      const err = new Error('Access forbidden: member does not belong to your family');
      err.statusCode = 403;
      throw err;
    }

    member.status = 'REMOVED';
    member.removed_at = new Date();
    await member.save();

    return true;
  },
};
