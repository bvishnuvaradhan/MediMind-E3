import { Router } from 'express';
import { serviceUrls } from '../config/services.js';
import { verifyJwt } from '../middleware/authMiddleware.js';
import { forwardRequest } from '../utils/proxy.js';

const router = Router();
const proxyKnowledge = forwardRequest(serviceUrls.knowledge);

// GET /api/knowledge/articles is public (published articles)
// Other actions require JWT
router.get('/articles', proxyKnowledge);
router.get('/articles/:articleId', proxyKnowledge);
router.use(verifyJwt, proxyKnowledge);

export default router;
