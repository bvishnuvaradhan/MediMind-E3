import { departmentHeadService } from '../services/departmentHeadService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export const departmentHeadController = {
  create: async (req, res, next) => {
    try {
      const data = await departmentHeadService.createDepartmentHead(req.body, req.user);
      return successResponse(res, 201, 'Department head assigned successfully', data);
    } catch (error) {
      next(error);
    }
  },

  list: async (req, res, next) => {
    try {
      const data = await departmentHeadService.listDepartmentHeads(req.query, req.user);
      return successResponse(res, 200, 'Department heads retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const data = await departmentHeadService.getDepartmentHeadById(req.params.headId, req.user);
      return successResponse(res, 200, 'Department head retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const data = await departmentHeadService.updateDepartmentHead(req.params.headId, req.body, req.user);
      return successResponse(res, 200, 'Department head updated successfully', data);
    } catch (error) {
      next(error);
    }
  },
};
