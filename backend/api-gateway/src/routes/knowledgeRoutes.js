import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { optionalJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyKnowledge = forwardRequest(serviceUrls.knowledge);

// Public health route
router.get('/health', proxyKnowledge);

// Knowledge routes forward with optional JWT identity injection
// Downstream knowledge-service enforces role and scoping
router.use(optionalJwt, proxyKnowledge);

export default router;
