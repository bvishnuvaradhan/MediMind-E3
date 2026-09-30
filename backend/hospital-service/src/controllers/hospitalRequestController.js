import { hospitalRequestService } from '../services/hospitalRequestService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export const hospitalRequestController = {
  submit: async (req, res, next) => {
    try {
      const data = await hospitalRequestService.submitRequest(req.body);
      return successResponse(res, 201, 'Hospital onboarding request submitted successfully', data);
    } catch (error) {
      next(error);
    }
  },

  list: async (req, res, next) => {
    try {
      const data = await hospitalRequestService.listRequests(req.query, req.user);
      return successResponse(res, 200, 'Hospital onboarding requests retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const data = await hospitalRequestService.getRequestById(req.params.requestId, req.user);
      return successResponse(res, 200, 'Hospital onboarding request retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  approve: async (req, res, next) => {
    try {
      const data = await hospitalRequestService.approveRequest(req.params.requestId, req.user);
      return successResponse(res, 200, 'Hospital onboarding request approved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  reject: async (req, res, next) => {
    try {
      const reason = req.body?.reason || req.body?.rejectionReason || 'Criteria not met';
      const data = await hospitalRequestService.rejectRequest(req.params.requestId, reason, req.user);
      return successResponse(res, 200, 'Hospital onboarding request rejected successfully', data);
    } catch (error) {
      next(error);
    }
  },
};
