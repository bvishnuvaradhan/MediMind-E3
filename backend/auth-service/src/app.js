import './config/runtimeConfig.js';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import { authController } from './controllers/authController.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { getCorsOptions } from './config/runtimeConfig.js';
import { connectDB } from './config/db.js';

const app = express();

// Security & Parsing Middleware
app.use(cors(getCorsOptions()));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lazy serverless-safe database connection middleware
app.use(async (req, res, next) => {
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  try {
    await connectDB();
    return next();
  } catch (err) {
    return next(err);
  }
});

// Root health endpoint
app.get('/health', authController.health);

// Mount Auth routes under /api/auth
app.use('/api/auth', authRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
