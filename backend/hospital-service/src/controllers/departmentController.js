import { departmentService } from '../services/departmentService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export const departmentController = {
  create: async (req, res, next) => {
    try {
      const data = await departmentService.createDepartment(req.body, req.user);
      return successResponse(res, 201, 'Department created successfully', data);
    } catch (error) {
      next(error);
    }
  },

  list: async (req, res, next) => {
    try {
      const data = await departmentService.listDepartments(req.query, req.user);
      return successResponse(res, 200, 'Departments retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const data = await departmentService.getDepartmentById(req.params.departmentId, req.user);
      return successResponse(res, 200, 'Department retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const data = await departmentService.updateDepartment(req.params.departmentId, req.body, req.user);
      return successResponse(res, 200, 'Department updated successfully', data);
    } catch (error) {
      next(error);
    }
  },
};
