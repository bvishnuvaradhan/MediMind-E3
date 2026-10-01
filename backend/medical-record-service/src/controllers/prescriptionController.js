import { prescriptionService } from '../services/prescriptionService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export const prescriptionController = {
  /**
   * Create a new prescription (DRAFT)
   */
  async createPrescription(req, res, next) {
    try {
      const prescription = await prescriptionService.createPrescription(req.user, req.body);
      return successResponse(res, 201, 'Prescription created successfully', prescription);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get prescriptions for a family member
   */
  async getPrescriptionsByMember(req, res, next) {
    try {
      const { memberId } = req.params;
      const prescriptions = await prescriptionService.getPrescriptionsByMember(req.user, memberId);
      return successResponse(res, 200, 'Prescriptions retrieved successfully', prescriptions);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single prescription by ID
   */
  async getPrescriptionById(req, res, next) {
    try {
      const { prescriptionId } = req.params;
      const prescription = await prescriptionService.getPrescriptionById(req.user, prescriptionId);
      return successResponse(res, 200, 'Prescription retrieved successfully', prescription);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update DRAFT prescription
   */
  async updateDraft(req, res, next) {
    try {
      const { prescriptionId } = req.params;
      const prescription = await prescriptionService.updateDraft(req.user, prescriptionId, req.body);
      return successResponse(res, 200, 'Prescription updated successfully', prescription);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Finalize prescription (DRAFT -> FINAL)
   */
  async finalizePrescription(req, res, next) {
    try {
      const { prescriptionId } = req.params;
      const prescription = await prescriptionService.finalizePrescription(req.user, prescriptionId);
      return successResponse(res, 200, 'Prescription finalized successfully', prescription);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Correct prescription (Creates new linked CORRECTED prescription)
   */
  async correctPrescription(req, res, next) {
    try {
      const { prescriptionId } = req.params;
      const prescription = await prescriptionService.correctPrescription(req.user, prescriptionId, req.body);
      return successResponse(res, 201, 'Prescription corrected successfully', prescription);
    } catch (error) {
      next(error);
    }
  },
};
