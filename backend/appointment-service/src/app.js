import './config/runtimeConfig.js';
import express from 'express';
import cors from 'cors';
import appointmentRoutes from './routes/appointmentRoutes.js';
import { appointmentController } from './controllers/appointmentController.js';
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

// Health Check
app.get('/health', appointmentController.health);
app.get('/api/health', appointmentController.health);

// Mount Routes under /api
app.use('/api/appointments', appointmentRoutes);

// Mount Direct Routes (supports direct forwarding without path rewrite)
app.use('/appointments', appointmentRoutes);

// Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
