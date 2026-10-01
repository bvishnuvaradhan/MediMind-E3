import '../load-env.js';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || process.env.KNOWLEDGE_SERVICE_PORT || 5008;

const startServer = async () => {
  try {
    await connectDB();
    console.log(`[knowledge-service] Connected to MongoDB database: ${process.env.KNOWLEDGE_DB_NAME || 'medimind_knowledge'}`);

    const server = app.listen(PORT, () => {
      console.log(`[knowledge-service] Running on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log('[knowledge-service] Shutting down gracefully...');
      server.close(() => {
        console.log('[knowledge-service] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[knowledge-service] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
