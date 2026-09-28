import '../../load-env.js';
import express from 'express';
import cors from 'cors';
import familyRoutes from './routes/familyRoutes.js';
import familyMemberRoutes from './routes/familyMemberRoutes.js';
import { familyController } from './controllers/familyController.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health endpoint
app.get('/health', familyController.health);

// Mount Family routes
app.use('/api/families/members', familyMemberRoutes);
app.use('/api/families', familyRoutes);

// Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
