import mongoose from 'mongoose';
import { doctorService } from '../services/doctorService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export const doctorController = {
  async list(req, res, next) {
    try {
      const doctors = await doctorService.listDoctors(req.query, req.user);
      return successResponse(res, 200, 'Doctors retrieved successfully', doctors);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const doctor = await doctorService.getDoctorById(req.params.doctorId, req.user);
      return successResponse(res, 200, 'Doctor retrieved successfully', doctor);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const doctor = await doctorService.createDoctor(req.body, req.user);
      return successResponse(res, 201, 'Doctor created successfully', doctor);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const doctor = await doctorService.updateDoctor(req.params.doctorId, req.body, req.user);
      return successResponse(res, 200, 'Doctor profile updated successfully', doctor);
    } catch (error) {
      next(error);
    }
  },

  async getAvailability(req, res, next) {
    try {
      const availability = await doctorService.getAvailability(req.params.doctorId);
      return successResponse(res, 200, 'Doctor availability retrieved successfully', availability);
    } catch (error) {
      next(error);
    }
  },

  async updateAvailability(req, res, next) {
    try {
      const slots = req.body.availability || req.body;
      const result = await doctorService.updateAvailability(req.params.doctorId, slots, req.user);
      return successResponse(res, 200, 'Doctor availability updated successfully', result);
    } catch (error) {
      next(error);
    }
  },

  health(req, res) {
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    return res.status(200).json({
      success: true,
      message: 'Doctor Service is healthy',
      data: {
        status: 'UP',
        service: 'doctor-service',
        port: process.env.PORT || 5004,
        database: dbState,
        timestamp: new Date().toISOString(),
      },
    });
  },
};
