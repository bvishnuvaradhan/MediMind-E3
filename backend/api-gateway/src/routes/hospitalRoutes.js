import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyHospital = forwardRequest(serviceUrls.hospital);

router.use(verifyJwt, proxyHospital);

export default router;
