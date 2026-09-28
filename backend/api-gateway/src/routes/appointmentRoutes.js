import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyAppointment = forwardRequest(serviceUrls.appointment);

router.use(verifyJwt, proxyAppointment);

export default router;
