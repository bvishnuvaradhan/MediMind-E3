import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyAi = forwardRequest(serviceUrls.ai);

// Public health check route
router.get('/health', proxyAi);

// Protected routes (require JWT verification at the gateway)
router.use(verifyJwt, proxyAi);

export default router;
