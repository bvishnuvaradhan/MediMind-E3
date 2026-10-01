import express from 'express';
import { articleController } from '../controllers/articleController.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Health
router.get('/health', articleController.health);

// Article CRUD
router.get('/', optionalAuth, articleController.getArticles);
router.post('/', authenticate, requireRole('DOCTOR', 'DEPARTMENT_HEAD', 'CHAIRMAN'), articleController.createArticle);
router.get('/:articleId', optionalAuth, articleController.getArticleById);
router.put('/:articleId', authenticate, articleController.updateArticle);
router.delete('/:articleId', authenticate, articleController.deleteArticle);

// Review & Publish Workflow
router.post('/:articleId/submit', authenticate, articleController.submitForReview);
router.post('/:articleId/review', authenticate, requireRole('DEPARTMENT_HEAD', 'CHAIRMAN'), articleController.reviewArticle);
router.post('/:articleId/publish', authenticate, requireRole('DEPARTMENT_HEAD', 'CHAIRMAN'), articleController.publishArticle);

export default router;
