import { authService } from '../services/authService.js';
import mongoose from 'mongoose';

export const authController = {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. No user context found.',
        });
      }

      const userData = await authService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        data: userData,
      });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      await authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  async createInternalUser(req, res, next) {
    try {
      const internalSecret = process.env.INTERNAL_SERVICE_SECRET || 'medimind_internal_service_secret_2026';
      const providedSecret = req.headers['x-internal-service-secret'];
      if (!providedSecret || providedSecret !== internalSecret) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: internal service authentication required',
        });
      }

      const { email, password, role, accountType, account_type, referenceId, reference_id, status } = req.body;
      const user = await authService.createUser({
        email,
        password,
        role,
        accountType: accountType || account_type,
        referenceId: referenceId || reference_id,
        status,
      });

      res.status(201).json({
        success: true,
        message: 'Internal user created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async health(req, res) {
    const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
      success: true,
      message: 'Auth Service is healthy',
      data: {
        status: 'UP',
        service: 'auth-service',
        port: process.env.PORT || 5001,
        database: dbState,
        timestamp: new Date().toISOString(),
      },
    });
  },
};
