import { recordAccessService } from '../services/recordAccessService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export const recordAccessController = {
  /**
   * Grant doctor access to a family member's records
   */
  async grantAccess(req, res, next) {
    try {
      const access = await recordAccessService.grantAccess(req.user, req.body);
      return successResponse(res, 201, 'Record access granted successfully', access);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get active/granted doctors for a family member
   */
  async getMemberAccess(req, res, next) {
    try {
      const { memberId } = req.params;
      const accesses = await recordAccessService.getMemberAccess(req.user, memberId);
      return successResponse(res, 200, 'Member record accesses retrieved successfully', accesses);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Revoke record access
   */
  async revokeAccess(req, res, next) {
    try {
      const { accessId } = req.params;
      const access = await recordAccessService.revokeAccess(req.user, accessId);
      return successResponse(res, 200, 'Record access revoked successfully', access);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get doctor's access history
   */
  async getDoctorAccessHistory(req, res, next) {
    try {
      const history = await recordAccessService.getDoctorAccessHistory(req.user);
      return successResponse(res, 200, 'Doctor access history retrieved successfully', history);
    } catch (error) {
      next(error);
    }
  },
};
