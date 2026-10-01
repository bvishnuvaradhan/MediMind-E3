import express from 'express';
import { medicalRecordController } from '../controllers/medicalRecordController.js';
import { recordAccessController } from '../controllers/recordAccessController.js';
import { authenticate, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Health
router.get('/health', medicalRecordController.health);

// Access Control routes
router.post('/access', authenticate, requireRole('FAMILY'), recordAccessController.grantAccess);
router.get('/access/member/:memberId', authenticate, recordAccessController.getMemberAccess);
router.put('/access/:accessId/revoke', authenticate, requireRole('FAMILY'), recordAccessController.revokeAccess);
router.get('/access/doctor/me', authenticate, requireRole('DOCTOR'), recordAccessController.getDoctorAccessHistory);

// Medical Record routes
router.post('/upload', authenticate, medicalRecordController.uploadRecord);
router.post('/', authenticate, medicalRecordController.uploadRecord);
router.get('/member/:memberId', authenticate, medicalRecordController.getRecordsByMember);
router.get('/:recordId', authenticate, medicalRecordController.getRecordById);
router.put('/:recordId', authenticate, medicalRecordController.updateRecord);
router.delete('/:recordId', authenticate, medicalRecordController.deleteRecord);

export default router;
