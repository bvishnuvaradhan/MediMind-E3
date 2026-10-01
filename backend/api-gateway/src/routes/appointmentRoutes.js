import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyAppointment = forwardRequest(serviceUrls.appointment);

// Public health route
router.get('/health', proxyAppointment);

// Protected routes (require JWT verification at the gateway)
router.use(verifyJwt, proxyAppointment);

export default router;
