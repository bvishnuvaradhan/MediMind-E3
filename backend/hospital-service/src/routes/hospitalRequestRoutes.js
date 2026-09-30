import { Router } from 'express';
import { hospitalRequestController } from '../controllers/hospitalRequestController.js';
import { authenticate, requireChairman } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', hospitalRequestController.submit);
router.get('/', authenticate, requireChairman, hospitalRequestController.list);
router.get('/:requestId', authenticate, requireChairman, hospitalRequestController.getById);
router.put('/:requestId/approve', authenticate, requireChairman, hospitalRequestController.approve);
router.post('/:requestId/approve', authenticate, requireChairman, hospitalRequestController.approve);
router.put('/:requestId/reject', authenticate, requireChairman, hospitalRequestController.reject);
router.post('/:requestId/reject', authenticate, requireChairman, hospitalRequestController.reject);

export default router;
