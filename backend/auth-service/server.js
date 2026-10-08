import '../load-env.js';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedCanonicalAuthUsers } from './src/utils/seedData.js';

const PORT = process.env.PORT || process.env.AUTH_SERVICE_PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    console.log(`[auth-service] Connected to MongoDB database: ${process.env.AUTH_DB_NAME || 'medimind_auth'}`);

    await seedCanonicalAuthUsers();

    const server = app.listen(PORT, () => {
      console.log(`[auth-service] Running on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log('[auth-service] Shutting down gracefully...');
      server.close(() => {
        console.log('[auth-service] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[auth-service] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
