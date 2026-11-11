import { Router } from 'express';
import { handleUpload } from '@vercel/blob/client';
import { serviceUrls } from '../config/services.js';
import { getInternalServiceSecret, getInternalServiceKey } from '../config/runtimeConfig.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';
import { kafkaProducer } from '../utils/kafkaProducer.js';

const router = Router();
const proxyAi = forwardRequest(() => serviceUrls.ai);

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
    const internalSecret = getInternalServiceSecret();
    const internalKey = getInternalServiceKey();
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

// Direct Vercel Blob client-upload token exchange for radiographs > 4.5 MB
const conditionalBlobAuth = (req, res, next) => {
  if (req.body?.type === 'blob.upload-completed') {
    return next();
  }
  return verifyJwt(req, res, (err) => {
    if (err) return next(err);
    return requireRole('FAMILY', 'DOCTOR')(req, res, next);
  });
};

router.post('/fracture/blob-upload', conditionalBlobAuth, async (req, res) => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({
      success: false,
      message: 'Vercel Blob storage is not configured (BLOB_READ_WRITE_TOKEN missing).',
    });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!pathname || typeof pathname !== 'string' || pathname.includes('..') || pathname.includes('\\') || pathname.startsWith('/')) {
          throw new Error('Invalid radiograph upload pathname.');
        }

        if (clientPayload) {
          let parsedPayload;
          try {
            parsedPayload = JSON.parse(clientPayload);
          } catch {
            throw new Error('Invalid clientPayload JSON.');
          }
          if (!parsedPayload || typeof parsedPayload !== 'object' || !parsedPayload.family_member_id) {
            throw new Error('clientPayload must include family_member_id.');
          }
        }

        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/tiff',
            'image/bmp',
            'application/dicom',
            'application/octet-stream',
          ],
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: req.user?.userId || null,
            role: req.user?.role || null,
            referenceId: req.user?.referenceId || null,
          }),
        };
      },
      onUploadCompleted: async () => {},
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error?.message || 'Unable to handle Vercel Blob upload request.',
    });
  }
});

// Protected inference and prediction history routes (clinical access for FAMILY and DOCTOR)
router.use(verifyJwt, requireRole('FAMILY', 'DOCTOR'), proxyAiWithKafka);

export default router;
