import { Router } from 'express';
import { departmentController } from '../controllers/departmentController.js';
import {
  authenticate,
  optionalAuth,
  requireHospitalAdminOrChairman,
  requireDeptHeadOrHospitalAdminOrChairman,
} from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalAuth, departmentController.list);
router.post('/', authenticate, requireHospitalAdminOrChairman, departmentController.create);
router.get('/:departmentId', optionalAuth, departmentController.getById);
router.put('/:departmentId', authenticate, requireDeptHeadOrHospitalAdminOrChairman, departmentController.update);

export default router;
