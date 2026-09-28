import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyRecord = forwardRequest(serviceUrls.record);

router.use(verifyJwt, proxyRecord);

export default router;
