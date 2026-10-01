import express from 'express';
import { prescriptionController } from '../controllers/prescriptionController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, requireRole('DOCTOR'), prescriptionController.createPrescription);
router.get('/member/:memberId', authenticate, prescriptionController.getPrescriptionsByMember);
router.get('/:prescriptionId', authenticate, prescriptionController.getPrescriptionById);
router.put('/:prescriptionId/finalize', authenticate, requireRole('DOCTOR'), prescriptionController.finalizePrescription);
router.post('/:prescriptionId/correct', authenticate, requireRole('DOCTOR'), prescriptionController.correctPrescription);
router.put('/:prescriptionId', authenticate, requireRole('DOCTOR'), prescriptionController.updateDraft);

export default router;
