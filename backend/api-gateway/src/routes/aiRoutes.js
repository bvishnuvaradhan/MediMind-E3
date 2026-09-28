import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyAi = forwardRequest(serviceUrls.ai);

router.use(verifyJwt, proxyAi);

export default router;
