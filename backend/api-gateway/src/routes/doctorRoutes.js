import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyDoctor = forwardRequest(serviceUrls.doctor);

router.use(verifyJwt, proxyDoctor);

export default router;
