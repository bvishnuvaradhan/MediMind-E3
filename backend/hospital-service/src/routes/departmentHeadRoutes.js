import { Router } from 'express';
import { departmentHeadController } from '../controllers/departmentHeadController.js';
import { authenticate, requireHospitalAdminOrChairman } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, requireHospitalAdminOrChairman, departmentHeadController.list);
router.post('/', authenticate, requireHospitalAdminOrChairman, departmentHeadController.create);
router.get('/:headId', authenticate, requireHospitalAdminOrChairman, departmentHeadController.getById);
router.put('/:headId', authenticate, requireHospitalAdminOrChairman, departmentHeadController.update);

export default router;
