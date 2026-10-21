import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Health endpoints
router.get('/health', appointmentController.health);

// Notifications endpoints (must be before :appointmentId)
router.get('/notifications', authenticate, appointmentController.getNotifications);
router.put('/notifications/:notificationId/read', authenticate, appointmentController.markNotificationRead);

// Alternatives discovery (standalone or appointment-linked)
router.get('/alternatives', authenticate, appointmentController.getAlternatives);
router.get('/:appointmentId/alternatives', authenticate, appointmentController.getAlternatives);

// Reports endpoints (Owner Portal / Hospital Admin) - Must be before /:appointmentId
router.get('/reports/preview', authenticate, requireRole('CHAIRMAN', 'HOSPITAL_ADMIN'), appointmentController.getReportPreview);
router.get('/reports/export-excel', authenticate, requireRole('CHAIRMAN', 'HOSPITAL_ADMIN'), appointmentController.exportReportExcel);

// Protected routes (All appointment operations require authentication)
router.post('/', authenticate, appointmentController.bookAppointment);
router.get('/', authenticate, appointmentController.getAppointments);
router.get('/stats', authenticate, appointmentController.getStats);
router.get('/:appointmentId', authenticate, appointmentController.getAppointmentById);
router.put('/:appointmentId/reschedule', authenticate, appointmentController.rescheduleAppointment);
router.put('/:appointmentId/cancel', authenticate, appointmentController.cancelAppointment);
router.put('/:appointmentId/complete', authenticate, appointmentController.completeAppointment);
router.put('/:appointmentId/status', authenticate, appointmentController.updateStatus);

export default router;
