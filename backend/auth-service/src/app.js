import '../../load-env.js';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import { authController } from './controllers/authController.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();

// Security & Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health endpoint
app.get('/health', authController.health);

// Mount Auth routes under /api/auth
app.use('/api/auth', authRoutes);

// Error Handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
