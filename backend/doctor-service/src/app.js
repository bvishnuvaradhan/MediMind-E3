import '../../load-env.js';
import express from 'express';
import cors from 'cors';
import doctorRoutes from './routes/doctorRoutes.js';
import { doctorController } from './controllers/doctorController.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();

// Security & Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', doctorController.health);
app.get('/api/health', doctorController.health);

// Mount Routes under /api
app.use('/api/doctors', doctorRoutes);

// Mount Direct Routes (supports direct forwarding without path rewrite)
app.use('/doctors', doctorRoutes);

// Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
