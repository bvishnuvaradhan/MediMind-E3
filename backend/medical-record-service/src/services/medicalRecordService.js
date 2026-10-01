import mongoose from 'mongoose';
import MedicalRecord from '../models/MedicalRecord.js';
import { internalServices } from '../utils/internalServices.js';
import { recordAccessService } from './recordAccessService.js';

export const medicalRecordService = {
  /**
   * Upload / create a new medical record
   */
  async createRecord(user, payload) {
    // 1. Role validation
    if (!['FAMILY', 'DOCTOR'].includes(user.role)) {
      const err = new Error('Access forbidden: administrative roles cannot create private patient clinical records');
      err.statusCode = 403;
      throw err;
    }

    const familyMemberId = payload.familyMemberId || payload.family_member_id;
    const recordType = (payload.recordType || payload.record_type || '').toUpperCase();
    const fileName = payload.fileName || payload.file_name;
    const fileUrl = payload.fileUrl || payload.file_url;
    const description = payload.description || null;
    const recordDateStr = payload.recordDate || payload.record_date;

    if (!familyMemberId || !recordType || !fileName || !fileUrl || !recordDateStr) {
      const err = new Error('familyMemberId, recordType, fileName, fileUrl, and recordDate are required');
      err.statusCode = 400;
      throw err;
    }

    if (!mongoose.Types.ObjectId.isValid(familyMemberId)) {
      const err = new Error('Invalid familyMemberId format');
      err.statusCode = 400;
      throw err;
    }

    const validRecordTypes = ['REPORT', 'TEST', 'XRAY', 'SCAN', 'ECG', 'PRESCRIPTION_DOCUMENT', 'OTHER'];
    if (!validRecordTypes.includes(recordType)) {
      const err = new Error(`recordType must be one of: ${validRecordTypes.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const recordDate = new Date(recordDateStr);
    if (isNaN(recordDate.getTime())) {
      const err = new Error('Invalid recordDate format');
      err.statusCode = 400;
      throw err;
    }

    // 2. Ownership & Authorization checks
    if (user.role === 'FAMILY') {
      const memberCheck = await internalServices.verifyFamilyMember({ user, memberId: familyMemberId });
      if (!memberCheck.valid) {
        const err = new Error(memberCheck.message || 'Access forbidden: member does not belong to your family');
        err.statusCode = memberCheck.statusCode || 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      const hasAccess = await recordAccessService.hasActiveAccess(doctorId, familyMemberId);
      if (!hasAccess) {
        const err = new Error('Access forbidden: active doctor record access authorization required');
        err.statusCode = 403;
        throw err;
      }
    }

    // 3. Create Record
    const record = await MedicalRecord.create({
      family_member_id: familyMemberId,
      record_type: recordType,
      file_name: fileName.trim(),
      file_url: fileUrl.trim(),
      description: description ? description.trim() : null,
      record_date: recordDate,
      uploaded_by: user.userId,
      source: user.role === 'FAMILY' ? 'FAMILY' : 'DOCTOR',
      status: 'ACTIVE',
    });

    return record.toPublicJSON();
  },

  /**
   * Retrieve all records for a family member
   */
  async getRecordsByMember(user, memberId, query = {}) {
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      const err = new Error('Invalid member ID format');
      err.statusCode = 400;
      throw err;
    }

    // 1. Authorization check
    if (user.role === 'FAMILY') {
      const memberCheck = await internalServices.verifyFamilyMember({ user, memberId });
      if (!memberCheck.valid) {
        const err = new Error(memberCheck.message || 'Access forbidden: member does not belong to your family');
        err.statusCode = memberCheck.statusCode || 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      // An appointment alone does NOT grant access — must have ACTIVE RecordAccess!
      const hasAccess = await recordAccessService.hasActiveAccess(doctorId, memberId);
      if (!hasAccess) {
        const err = new Error('Access forbidden: active doctor record access authorization required');
        err.statusCode = 403;
        throw err;
      }
    } else {
      // Administrative roles (HOSPITAL_ADMIN, DEPARTMENT_HEAD, CHAIRMAN) do not have access
      const err = new Error('Access forbidden: administrative roles cannot access private patient clinical records');
      err.statusCode = 403;
      throw err;
    }

    // 2. Fetch records
    const filter = {
      family_member_id: memberId,
      status: 'ACTIVE',
    };

    if (query.recordType || query.record_type) {
      filter.record_type = (query.recordType || query.record_type).toUpperCase();
    }

    const records = await MedicalRecord.find(filter).sort({ record_date: -1 });
    return records.map((r) => r.toPublicJSON());
  },

  /**
   * Retrieve a single record by ID
   */
  async getRecordById(user, recordId) {
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      const err = new Error('Invalid record ID format');
      err.statusCode = 400;
      throw err;
    }

    const record = await MedicalRecord.findOne({
      _id: recordId,
      status: { $ne: 'DELETED' },
    });

    if (!record) {
      const err = new Error('Medical record not found');
      err.statusCode = 404;
      throw err;
    }

    // Authorization check
    if (user.role === 'FAMILY') {
      const memberCheck = await internalServices.verifyFamilyMember({ user, memberId: record.family_member_id });
      if (!memberCheck.valid) {
        const err = new Error('Access forbidden: record belongs to a member outside your family');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      const hasAccess = await recordAccessService.hasActiveAccess(doctorId, record.family_member_id);
      if (!hasAccess) {
        const err = new Error('Access forbidden: active doctor record access authorization required');
        err.statusCode = 403;
        throw err;
      }
    } else {
      const err = new Error('Access forbidden: administrative roles cannot access private patient clinical records');
      err.statusCode = 403;
      throw err;
    }

    return record.toPublicJSON();
  },

  /**
   * Update medical record metadata
   */
  async updateRecord(user, recordId, payload) {
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      const err = new Error('Invalid record ID format');
      err.statusCode = 400;
      throw err;
    }

    const record = await MedicalRecord.findOne({
      _id: recordId,
      status: { $ne: 'DELETED' },
    });

    if (!record) {
      const err = new Error('Medical record not found');
      err.statusCode = 404;
      throw err;
    }

    if (user.role === 'FAMILY') {
      const memberCheck = await internalServices.verifyFamilyMember({ user, memberId: record.family_member_id });
      if (!memberCheck.valid) {
        const err = new Error('Access forbidden: cannot modify a record belonging to another family');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      const doctorId = user.doctorId || user.referenceId;
      const hasAccess = await recordAccessService.hasActiveAccess(doctorId, record.family_member_id);
      if (!hasAccess) {
        const err = new Error('Access forbidden: active doctor record access authorization required');
        err.statusCode = 403;
        throw err;
      }
    } else {
      const err = new Error('Access forbidden: administrative roles cannot modify patient medical records');
      err.statusCode = 403;
      throw err;
    }

    if (payload.description !== undefined) {
      record.description = payload.description ? payload.description.trim() : null;
    }
    if (payload.recordType || payload.record_type) {
      record.record_type = (payload.recordType || payload.record_type).toUpperCase();
    }
    if (payload.fileName || payload.file_name) {
      record.file_name = (payload.fileName || payload.file_name).trim();
    }
    if (payload.fileUrl || payload.file_url) {
      record.file_url = (payload.fileUrl || payload.file_url).trim();
    }
    if (payload.recordDate || payload.record_date) {
      record.record_date = new Date(payload.recordDate || payload.record_date);
    }

    await record.save();
    return record.toPublicJSON();
  },

  /**
   * Soft-delete medical record
   */
  async deleteRecord(user, recordId) {
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      const err = new Error('Invalid record ID format');
      err.statusCode = 400;
      throw err;
    }

    const record = await MedicalRecord.findOne({
      _id: recordId,
      status: { $ne: 'DELETED' },
    });

    if (!record) {
      const err = new Error('Medical record not found');
      err.statusCode = 404;
      throw err;
    }

    if (user.role === 'FAMILY') {
      const memberCheck = await internalServices.verifyFamilyMember({ user, memberId: record.family_member_id });
      if (!memberCheck.valid) {
        const err = new Error('Access forbidden: cannot delete a record belonging to another family');
        err.statusCode = 403;
        throw err;
      }
    } else if (user.role === 'DOCTOR') {
      if (record.uploaded_by.toString() !== user.userId.toString()) {
        const err = new Error('Access forbidden: doctors can only delete records they personally uploaded');
        err.statusCode = 403;
        throw err;
      }
    } else {
      const err = new Error('Access forbidden: administrative roles cannot delete patient medical records');
      err.statusCode = 403;
      throw err;
    }

    record.status = 'DELETED';
    await record.save();

    return record.toPublicJSON();
  },
};
