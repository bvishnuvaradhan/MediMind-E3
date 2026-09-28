import { Router } from 'express';
import { familyMemberController } from '../controllers/familyMemberController.js';
import { authenticateFamily } from '../middleware/authMiddleware.js';

const router = Router();

// All member operations require FAMILY role authentication
router.use(authenticateFamily);

router.post('/', familyMemberController.addMember);
router.get('/', familyMemberController.getMembers);
router.get('/:memberId', familyMemberController.getMemberById);
router.put('/:memberId', familyMemberController.updateMember);
router.delete('/:memberId', familyMemberController.removeMember);

export default router;
