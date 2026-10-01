import express from 'express';
import { consultationController } from '../controllers/consultationController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticate, requireRole('DOCTOR'), consultationController.createConsultation);
router.get('/member/:memberId', authenticate, consultationController.getConsultationsByMember);
router.get('/:consultationId', authenticate, consultationController.getConsultationById);
router.put('/:consultationId/finalize', authenticate, requireRole('DOCTOR'), consultationController.finalizeConsultation);
router.post('/:consultationId/amend', authenticate, requireRole('DOCTOR'), consultationController.amendConsultation);
router.put('/:consultationId', authenticate, requireRole('DOCTOR'), consultationController.updateDraft);

export default router;
