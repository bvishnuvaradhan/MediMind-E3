import { consultationService } from '../services/consultationService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export const consultationController = {
  /**
   * Create a new consultation (DRAFT)
   */
  async createConsultation(req, res, next) {
    try {
      const consultation = await consultationService.createConsultation(req.user, req.body);
      return successResponse(res, 201, 'Consultation created successfully', consultation);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get consultations for a family member
   */
  async getConsultationsByMember(req, res, next) {
    try {
      const { memberId } = req.params;
      const consultations = await consultationService.getConsultationsByMember(req.user, memberId);
      return successResponse(res, 200, 'Consultations retrieved successfully', consultations);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single consultation by ID
   */
  async getConsultationById(req, res, next) {
    try {
      const { consultationId } = req.params;
      const consultation = await consultationService.getConsultationById(req.user, consultationId);
      return successResponse(res, 200, 'Consultation retrieved successfully', consultation);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update DRAFT consultation
   */
  async updateDraft(req, res, next) {
    try {
      const { consultationId } = req.params;
      const consultation = await consultationService.updateDraft(req.user, consultationId, req.body);
      return successResponse(res, 200, 'Consultation updated successfully', consultation);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Finalize consultation (DRAFT -> FINAL)
   */
  async finalizeConsultation(req, res, next) {
    try {
      const { consultationId } = req.params;
      const consultation = await consultationService.finalizeConsultation(req.user, consultationId);
      return successResponse(res, 200, 'Consultation finalized successfully', consultation);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Amend consultation (Creates new linked AMENDED consultation)
   */
  async amendConsultation(req, res, next) {
    try {
      const { consultationId } = req.params;
      const consultation = await consultationService.amendConsultation(req.user, consultationId, req.body);
      return successResponse(res, 201, 'Consultation amended successfully', consultation);
    } catch (error) {
      next(error);
    }
  },
};
