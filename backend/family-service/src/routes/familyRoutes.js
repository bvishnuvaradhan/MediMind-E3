import { Router } from 'express';
import { familyController } from '../controllers/familyController.js';
import { authenticateFamily } from '../middleware/authMiddleware.js';

const router = Router();

// Public route: Create family account
router.post('/', familyController.createFamily);

// Health route
router.get('/health', familyController.health);
router.get('/', authenticateFamily, familyController.getFamilies);
router.get('/:familyId/members', authenticateFamily, familyController.getFamilyMembersByFamilyId);

// Protected routes: Family account operations
router.get('/me', authenticateFamily, familyController.getMyFamily);
router.get('/my-family', authenticateFamily, familyController.getMyFamily);
router.put('/me', authenticateFamily, familyController.updateMyFamily);

export default router;
