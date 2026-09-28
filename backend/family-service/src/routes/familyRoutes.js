import { Router } from 'express';
import { familyController } from '../controllers/familyController.js';
import { authenticateFamily } from '../middleware/authMiddleware.js';

const router = Router();

// Public route: Create family account
router.post('/', familyController.createFamily);

// Health route
router.get('/health', familyController.health);

// Protected routes: Family account operations
router.get('/me', authenticateFamily, familyController.getMyFamily);
router.put('/me', authenticateFamily, familyController.updateMyFamily);

export default router;
