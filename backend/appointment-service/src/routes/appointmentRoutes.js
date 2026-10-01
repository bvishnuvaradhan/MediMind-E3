import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

// Health endpoints
router.get('/health', appointmentController.health);

// Protected routes (All appointment operations require authentication)
router.post('/', authenticate, appointmentController.bookAppointment);
router.get('/', authenticate, appointmentController.getAppointments);
router.get('/:appointmentId', authenticate, appointmentController.getAppointmentById);
router.put('/:appointmentId/reschedule', authenticate, appointmentController.rescheduleAppointment);
router.put('/:appointmentId/cancel', authenticate, appointmentController.cancelAppointment);
router.put('/:appointmentId/complete', authenticate, appointmentController.completeAppointment);
router.put('/:appointmentId/status', authenticate, appointmentController.updateStatus);

export default router;
