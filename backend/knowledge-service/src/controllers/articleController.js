import mongoose from 'mongoose';
import { articleService } from '../services/articleService.js';
import { successResponse } from '../utils/responseEnvelope.js';

export const articleController = {
  /**
   * Health endpoint
   */
  async health(req, res) {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'CONNECTED' : dbState === 2 ? 'CONNECTING' : 'DISCONNECTED';
    return res.status(200).json({
      success: true,
      message: 'Knowledge Service is healthy',
      data: {
        status: 'UP',
        service: 'knowledge-service',
        port: process.env.PORT || 5008,
        database: dbStatus,
        timestamp: new Date().toISOString(),
      },
    });
  },

  /**
   * Create an article (DRAFT or direct SUBMITTED)
   */
  async createArticle(req, res, next) {
    try {
      const article = await articleService.createArticle(req.user, req.body);
      return successResponse(res, 201, 'Article created successfully', article);
    } catch (error) {
      next(error);
    }
  },

  /**
   * List articles with role-based scoping and filters
   */
  async getArticles(req, res, next) {
    try {
      const articles = await articleService.getArticles(req.user, req.query);
      return successResponse(res, 200, 'Articles retrieved successfully', articles);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single article by ID
   */
  async getArticleById(req, res, next) {
    try {
      const { articleId } = req.params;
      const article = await articleService.getArticleById(req.user, articleId);
      return successResponse(res, 200, 'Article retrieved successfully', article);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update article content / metadata
   */
  async updateArticle(req, res, next) {
    try {
      const { articleId } = req.params;
      const article = await articleService.updateArticle(req.user, articleId, req.body);
      return successResponse(res, 200, 'Article updated successfully', article);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete article (draft only)
   */
  async deleteArticle(req, res, next) {
    try {
      const { articleId } = req.params;
      const result = await articleService.deleteArticle(req.user, articleId);
      return successResponse(res, 200, 'Article deleted successfully', result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit article for peer review
   */
  async submitForReview(req, res, next) {
    try {
      const { articleId } = req.params;
      const article = await articleService.submitForReview(req.user, articleId);
      return successResponse(res, 200, 'Article submitted for review successfully', article);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Department Head peer review (Approve or Request Changes)
   */
  async reviewArticle(req, res, next) {
    try {
      const { articleId } = req.params;
      const article = await articleService.reviewArticle(req.user, articleId, req.body);
      return successResponse(res, 200, 'Article review completed successfully', article);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Publish approved article
   */
  async publishArticle(req, res, next) {
    try {
      const { articleId } = req.params;
      const article = await articleService.publishArticle(req.user, articleId);
      return successResponse(res, 200, 'Article published successfully', article);
    } catch (error) {
      next(error);
    }
  },
};
