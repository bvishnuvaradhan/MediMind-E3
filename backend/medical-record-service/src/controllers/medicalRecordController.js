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
