import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { optionalJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyDoctor = forwardRequest(serviceUrls.doctor);

// Doctor Service routes forward with optional JWT identity injection
// Downstream doctor-service enforces role, hospital, and department scoping
router.use(optionalJwt, proxyDoctor);

export default router;
