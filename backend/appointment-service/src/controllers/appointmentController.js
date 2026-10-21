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
   * Get appointment aggregation statistics
   */
  async getStats(req, res, next) {
    try {
      const stats = await appointmentService.getStats(req.user, req.query);
      return successResponse(res, 200, 'Appointment stats retrieved successfully', stats);
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

  /**
   * Get alternative doctors and slots after cancellation
   */
  async getAlternatives(req, res, next) {
    try {
      const appointmentId = req.params.appointmentId || req.query.appointmentId;
      const alternatives = await appointmentService.getAlternatives(req.user, appointmentId, req.query);
      return successResponse(res, 200, 'Alternative appointments retrieved successfully', alternatives);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get in-app notifications
   */
  async getNotifications(req, res, next) {
    try {
      const notifications = await appointmentService.getNotifications(req.user, req.query);
      return successResponse(res, 200, 'Notifications retrieved successfully', notifications);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark notification as read
   */
  /**
   * Owner Portal Reports: Preview doctor and appointment report
   */
  async getReportPreview(req, res, next) {
    try {
      const preview = await appointmentService.getReportPreview(req.user, req.query);
      return successResponse(res, 200, 'Report preview generated successfully', preview);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Owner Portal Reports: Export doctor and appointment Excel report (.xlsx)
   */
  async exportReportExcel(req, res, next) {
    try {
      await appointmentService.exportReportExcel(req.user, req.query, res);
    } catch (error) {
      next(error);
    }
  },

  async markNotificationRead(req, res, next) {
    try {
      const { notificationId } = req.params;
      const notification = await appointmentService.markNotificationRead(req.user, notificationId);
      return successResponse(res, 200, 'Notification marked as read', notification);
    } catch (error) {
      next(error);
    }
  },
};
