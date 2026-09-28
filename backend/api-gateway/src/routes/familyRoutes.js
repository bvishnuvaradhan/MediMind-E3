import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyFamily = forwardRequest(serviceUrls.family);

// Public routes
router.post('/', proxyFamily);
router.get('/health', proxyFamily);

// Protected routes (require JWT)
router.use(verifyJwt, proxyFamily);

export default router;
