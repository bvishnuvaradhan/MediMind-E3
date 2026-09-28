import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyFamily = forwardRequest(serviceUrls.family);

// All family routes require authentication (except future registration if needed)
router.use(verifyJwt, proxyFamily);

export default router;
