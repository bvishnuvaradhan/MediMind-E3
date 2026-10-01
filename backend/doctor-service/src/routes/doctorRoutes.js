import { Router } from 'express';
import { doctorController } from '../controllers/doctorController.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// 1. Service Health
router.get('/health', doctorController.health);

// 2. Doctor Directory Listing & Creation
router.get('/', optionalAuth, doctorController.list);
router.post('/', authenticate, requireRole('DEPARTMENT_HEAD', 'HOSPITAL_ADMIN', 'CHAIRMAN'), doctorController.create);

// 3. Availability Endpoints (Defined before generic :doctorId)
router.get('/:doctorId/availability', optionalAuth, doctorController.getAvailability);
router.put('/:doctorId/availability', authenticate, doctorController.updateAvailability);

// 4. Single Doctor Details & Profile Update
router.get('/:doctorId', optionalAuth, doctorController.getById);
router.put('/:doctorId', authenticate, doctorController.update);

export default router;
