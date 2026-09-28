import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/securityMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyAuth = forwardRequest(serviceUrls.auth);

// Public route: Login (rate-limited)
router.post('/login', authRateLimiter, proxyAuth);

// Protected routes: require valid JWT
router.post('/logout', verifyJwt, proxyAuth);
router.get('/me', verifyJwt, proxyAuth);
router.post('/change-password', verifyJwt, proxyAuth);

// Auth Service Health Check passthrough
router.get('/health', proxyAuth);

export default router;
