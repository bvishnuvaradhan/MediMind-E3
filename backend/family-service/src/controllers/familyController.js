import { familyService } from '../services/familyService.js';
import mongoose from 'mongoose';

export const familyController = {
  async createFamily(req, res, next) {
    try {
      const result = await familyService.createFamily(req.body);
      res.status(201).json({
        success: true,
        message: 'Family account created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyFamily(req, res, next) {
    try {
      const family = await familyService.getMyFamily(req.user);
      res.status(200).json({
        success: true,
        data: family,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateMyFamily(req, res, next) {
    try {
      const updated = await familyService.updateMyFamily(req.user, req.body);
      res.status(200).json({
        success: true,
        message: 'Family account updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },

  async health(req, res) {
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
      success: true,
      message: 'Family Service is healthy',
      data: {
        status: 'UP',
        service: 'family-service',
        port: process.env.PORT || 5002,
        database: dbState,
        timestamp: new Date().toISOString(),
      },
    });
  },
};
