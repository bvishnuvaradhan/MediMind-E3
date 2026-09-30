import '../../load-env.js';
import express from 'express';
import cors from 'cors';
import hospitalRoutes from './routes/hospitalRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import departmentHeadRoutes from './routes/departmentHeadRoutes.js';
import hospitalRequestRoutes from './routes/hospitalRequestRoutes.js';
import { hospitalController } from './controllers/hospitalController.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();

// Security & Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', hospitalController.health);
app.get('/api/health', hospitalController.health);

// Mount Routes under /api
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/department-heads', departmentHeadRoutes);
app.use('/api/hospital-requests', hospitalRequestRoutes);

// Mount Direct Routes (supports direct forwarding without path rewrite)
app.use('/hospitals', hospitalRoutes);
app.use('/departments', departmentRoutes);
app.use('/department-heads', departmentHeadRoutes);
app.use('/hospital-requests', hospitalRequestRoutes);

// Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
