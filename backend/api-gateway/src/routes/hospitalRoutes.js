import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { optionalJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyHospital = forwardRequest(serviceUrls.hospital);

// Hospital Service routes forward with optional JWT identity injection
// Downstream hospital-service enforces role and hospital scoping as appropriate
router.use(optionalJwt, proxyHospital);

export default router;
