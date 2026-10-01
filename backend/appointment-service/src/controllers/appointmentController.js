import { appointmentService } from '../services/appointmentService.js';
import { successResponse } from '../utils/responseEnvelope.js';
import mongoose from 'mongoose';

export const appointmentController = {
  /**
   * Health endpoint
   */
  async health(req, res) {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'CONNECTED' : dbState === 2 ? 'CONNECTING' : 'DISCONNECTED';
    return res.status(200).json({
      success: true,
      message: 'Appointment Service is healthy',
      data: {
        status: 'UP',
        service: 'appointment-service',
        port: process.env.PORT || 5005,
        database: dbStatus,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Book appointment
   */
  async bookAppointment(req, res, next) {
    try {
      const appointment = await appointmentService.bookAppointment(req.user, req.body);
      return successResponse(res, 201, 'Appointment booked successfully', appointment);
    } catch (error) {
      next(error);
    }
  },

  /**
   * List appointments
   */
  async getAppointments(req, res, next) {
    try {
      const appointments = await appointmentService.getAppointments(req.user, req.query);
      return successResponse(res, 200, 'Appointments retrieved successfully', appointments);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single appointment
   */
  async getAppointmentById(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const appointment = await appointmentService.getAppointmentById(req.user, appointmentId);
      return successResponse(res, 200, 'Appointment retrieved successfully', appointment);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const appointment = await appointmentService.rescheduleAppointment(req.user, appointmentId, req.body);
      return successResponse(res, 200, 'Appointment rescheduled successfully', appointment);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const appointment = await appointmentService.cancelAppointment(req.user, appointmentId, req.body);
      return successResponse(res, 200, 'Appointment cancelled successfully', appointment);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Complete appointment
   */
  async completeAppointment(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const appointment = await appointmentService.completeAppointment(req.user, appointmentId);
      return successResponse(res, 200, 'Appointment completed successfully', appointment);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update status
   */
  async updateStatus(req, res, next) {
    try {
      const { appointmentId } = req.params;
      const { status } = req.body;
      const appointment = await appointmentService.updateStatus(req.user, appointmentId, status);
      return successResponse(res, 200, 'Appointment status updated successfully', appointment);
    } catch (error) {
      next(error);
    }
  },
};
