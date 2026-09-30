import { Router } from 'express';
import { hospitalController } from '../controllers/hospitalController.js';
import { hospitalRequestController } from '../controllers/hospitalRequestController.js';
import { authenticate, optionalAuth, requireChairman, requireHospitalAdminOrChairman } from '../middleware/authMiddleware.js';

const router = Router();

// 1. Health check
router.get('/health', hospitalController.health);

// 2. Hospital Request Onboarding endpoints
router.post('/requests', hospitalRequestController.submit);
router.get('/requests', authenticate, requireChairman, hospitalRequestController.list);
router.get('/requests/:requestId', authenticate, requireChairman, hospitalRequestController.getById);
router.put('/requests/:requestId/approve', authenticate, requireChairman, hospitalRequestController.approve);
router.post('/requests/:requestId/approve', authenticate, requireChairman, hospitalRequestController.approve);
router.put('/requests/:requestId/reject', authenticate, requireChairman, hospitalRequestController.reject);
router.post('/requests/:requestId/reject', authenticate, requireChairman, hospitalRequestController.reject);

// 3. Hospital endpoints
router.get('/', optionalAuth, hospitalController.list);
router.post('/', authenticate, requireChairman, hospitalController.create);
router.get('/:hospitalId', optionalAuth, hospitalController.getById);
router.put('/:hospitalId', authenticate, requireHospitalAdminOrChairman, hospitalController.update);

export default router;
