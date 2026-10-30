import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';
import { kafkaProducer } from '../../../kafkaClient.js';

const router = Router();
const proxyAi = forwardRequest(serviceUrls.ai);

/**
 * Enhanced proxy middleware that emits Kafka events to 'medimind.predictions'
 * after successful AI model execution.
 */
const proxyAiWithKafka = (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.method === 'POST') {
      const path = req.path.toLowerCase();
      let predictionType = null;
      if (path.includes('heart-disease')) predictionType = 'HEART_DISEASE';
      else if (path.includes('diabetes')) predictionType = 'DIABETES';
      else if (path.includes('general-health')) predictionType = 'GENERAL_HEALTH';
      else if (path.includes('fracture')) predictionType = 'FRACTURE';

      if (predictionType) {
        kafkaProducer.publishPrediction({
          patientId: req.user?.referenceId || req.user?.userId || data?.data?.family_member_id || data?.family_member_id,
          predictionId: data?.data?.prediction_id || data?.prediction_id,
          predictionType,
          riskLevel: data?.data?.risk_category || data?.data?.risk_level || data?.risk_level || data?.risk_category,
          source: 'api-gateway',
        });
      }
    }
    return originalJson(data);
  };
  return proxyAi(req, res, next);
};

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

// Platform-wide aggregate AI analytics (CHAIRMAN, HOSPITAL_ADMIN, DEPARTMENT_HEAD, DOCTOR)
router.get('/analytics', verifyJwt, requireRole('CHAIRMAN', 'HOSPITAL_ADMIN', 'DEPARTMENT_HEAD', 'DOCTOR'), proxyAi);

// Protected inference and prediction history routes (clinical access for FAMILY and DOCTOR)
router.use(verifyJwt, requireRole('FAMILY', 'DOCTOR'), proxyAiWithKafka);

export default router;
