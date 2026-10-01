import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyRecord = forwardRequest(serviceUrls.record);

// Public health route
router.get('/health', proxyRecord);

// Protected routes (require JWT verification at the gateway)
router.use(verifyJwt, proxyRecord);

export default router;
