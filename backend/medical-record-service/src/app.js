import '../../load-env.js';
import express from 'express';
import cors from 'cors';
import medicalRecordRoutes from './routes/medicalRecordRoutes.js';
import consultationRoutes from './routes/consultationRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import { medicalRecordController } from './controllers/medicalRecordController.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();

// Security & Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', medicalRecordController.health);
app.get('/api/health', medicalRecordController.health);
app.get('/records/health', medicalRecordController.health);
app.get('/api/records/health', medicalRecordController.health);

// Mount Routes under /api
app.use('/api/records', medicalRecordRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/record-access', medicalRecordRoutes);

// Mount Direct Routes (supports direct forwarding without path rewrite)
app.use('/records', medicalRecordRoutes);
app.use('/consultations', consultationRoutes);
app.use('/prescriptions', prescriptionRoutes);
app.use('/record-access', medicalRecordRoutes);

// Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
