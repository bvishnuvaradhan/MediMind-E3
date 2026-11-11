import './config/runtimeConfig.js';
import express from 'express';
import cors from 'cors';
import { getCorsOptions } from './config/runtimeConfig.js';
import { correlationIdMiddleware, sanitizeIdentityHeaders } from './middleware/securityMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import familyRoutes from './routes/familyRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import knowledgeRoutes from './routes/knowledgeRoutes.js';

const app = express();

// 1. CORS Configuration
app.use(cors(getCorsOptions()));

// 2. Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Security & Correlation ID Middleware
app.use(correlationIdMiddleware);
app.use(sanitizeIdentityHeaders);

// 4. Gateway Health Endpoint
const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Gateway is healthy',
    data: {
      status: 'UP',
      service: 'api-gateway',
      port: process.env.PORT || 5000,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    },
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// 5. Mount Microservice Routes under /api
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/departments', hospitalRoutes);
app.use('/api/department-heads', hospitalRoutes);
app.use('/api/hospital-requests', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/medical-records', recordRoutes);
app.use('/api/consultations', recordRoutes);
app.use('/api/prescriptions', recordRoutes);
app.use('/api/record-access', recordRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/knowledge', knowledgeRoutes);

// 6. Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
