import mongoose from 'mongoose';
import { medicalRecordService } from '../services/medicalRecordService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export const medicalRecordController = {
  /**
   * Health endpoint
   */
  async health(req, res) {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'CONNECTED' : dbState === 2 ? 'CONNECTING' : 'DISCONNECTED';
    return res.status(200).json({
      success: true,
      message: 'Medical Record Service is healthy',
      data: {
        status: 'UP',
        service: 'medical-record-service',
        port: process.env.PORT || 5006,
        database: dbStatus,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Upload / create a medical record
   */
  async uploadRecord(req, res, next) {
    try {
      const record = await medicalRecordService.createRecord(req.user, req.body);
      return successResponse(res, 201, 'Medical record created successfully', record);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all medical records for a family member
   */
  /**
   * List medical records (by query memberId or all family records)
   */
  async getRecords(req, res, next) {
    try {
      const memberId = req.params.memberId || req.query.memberId || req.query.familyMemberId;
      if (memberId) {
        const records = await medicalRecordService.getRecordsByMember(req.user, memberId, req.query);
        return successResponse(res, 200, 'Medical records retrieved successfully', records);
      }
      if (req.user.role === 'FAMILY') {
        const famId = req.user.referenceId || req.user.familyId;
        const famDb = mongoose.connection.useDb(process.env.FAMILY_DB_NAME || 'medimind_family');
        let queryObj = {};
        if (mongoose.Types.ObjectId.isValid(famId)) {
          queryObj = { family_id: new mongoose.Types.ObjectId(famId) };
        } else {
          const famDoc = await famDb.collection('families').findOne({ family_code: famId });
          if (famDoc) queryObj = { family_id: famDoc._id };
        }
        const members = await famDb.collection('familymembers').find(queryObj).toArray();
        const memberIds = members.map(m => m._id);
        const MedicalRecord = mongoose.model('MedicalRecord');
        const records = await MedicalRecord.find({ family_member_id: { $in: memberIds }, status: 'ACTIVE' }).sort({ record_date: -1 });
        return successResponse(res, 200, 'Medical records retrieved successfully', records.map(r => r.toPublicJSON()));
      }
      return res.status(400).json({ success: false, message: 'memberId query parameter is required' });
    } catch (error) {
      next(error);
    }
  },

  async getRecordsByMember(req, res, next) {
    try {
      const { memberId } = req.params;
      const records = await medicalRecordService.getRecordsByMember(req.user, memberId);
      return successResponse(res, 200, 'Medical records retrieved successfully', records);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single medical record by ID
   */
  async getRecordById(req, res, next) {
    try {
      const { recordId } = req.params;
      const record = await medicalRecordService.getRecordById(req.user, recordId);
      return successResponse(res, 200, 'Medical record retrieved successfully', record);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update medical record metadata
   */
  async updateRecord(req, res, next) {
    try {
      const { recordId } = req.params;
      const record = await medicalRecordService.updateRecord(req.user, recordId, req.body);
      return successResponse(res, 200, 'Medical record updated successfully', record);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete (soft-delete) medical record
   */
  async deleteRecord(req, res, next) {
    try {
      const { recordId } = req.params;
      const record = await medicalRecordService.deleteRecord(req.user, recordId);
      return successResponse(res, 200, 'Medical record deleted successfully', record);
    } catch (error) {
      next(error);
    }
  },
};
