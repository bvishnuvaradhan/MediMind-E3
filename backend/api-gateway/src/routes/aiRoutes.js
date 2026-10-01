import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyAi = forwardRequest(serviceUrls.ai);

// Public health check route
router.get('/health', async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';
    const internalKey = process.env.INTERNAL_SERVICE_KEY || internalSecret;
    const response = await fetch(`${serviceUrls.ai}/health`, {
      method: 'GET',
      headers: {
        'x-internal-service-secret': internalSecret,
        'X-Internal-Service-Key': internalKey,
      },
      signal: AbortSignal.timeout(5000),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return res.status(response.status).json(data || { success: false, message: 'AI Service returned error' });
    }

    return res.status(200).json({
      success: true,
      message: 'AI Prediction Service is healthy',
      data,
    });
  } catch (error) {
    if (
      error.cause?.code === 'ECONNREFUSED' ||
      error.code === 'ECONNREFUSED' ||
      error.cause?.code === 'ENOTFOUND' ||
      error.code === 'ENOTFOUND' ||
      error.message?.includes('fetch failed')
    ) {
      return res.status(503).json({
        success: false,
        message: 'AI Prediction Service temporarily unavailable',
      });
    }
    next(error);
  }
});

// Protected inference and prediction history routes (clinical access for FAMILY and DOCTOR)
router.use(verifyJwt, requireRole('FAMILY', 'DOCTOR'), proxyAi);

export default router;
