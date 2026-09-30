import mongoose from 'mongoose';
import { hospitalService } from '../services/hospitalService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export const hospitalController = {
  health: (_req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    return successResponse(res, 200, 'Hospital Service is healthy', {
      status: 'UP',
      service: 'hospital-service',
      port: process.env.PORT || process.env.HOSPITAL_SERVICE_PORT || 5003,
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  },

  list: async (req, res, next) => {
    try {
      const data = await hospitalService.listHospitals(req.query, req.user);
      return successResponse(res, 200, 'Hospitals retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const data = await hospitalService.getHospitalById(req.params.hospitalId, req.user);
      return successResponse(res, 200, 'Hospital retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const data = await hospitalService.updateHospital(req.params.hospitalId, req.body, req.user);
      return successResponse(res, 200, 'Hospital updated successfully', data);
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const data = await hospitalService.createHospital(req.body, req.user);
      return successResponse(res, 201, 'Hospital created successfully', data);
    } catch (error) {
      next(error);
    }
  },
};
