import '../../load-env.js';
import express from 'express';
import cors from 'cors';
import articleRoutes from './routes/articleRoutes.js';
import { articleController } from './controllers/articleController.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

const app = express();

// Security & Parsing Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', articleController.health);
app.get('/api/health', articleController.health);
app.get('/knowledge/health', articleController.health);
app.get('/api/knowledge/health', articleController.health);

// Mount Routes under /api/knowledge/articles and aliases
app.use('/api/knowledge/articles', articleRoutes);
app.use('/api/knowledge', articleRoutes);
app.use('/knowledge/articles', articleRoutes);
app.use('/knowledge', articleRoutes);
app.use('/articles', articleRoutes);

// Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
