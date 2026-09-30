import '../load-env.js';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedCanonicalData } from './src/utils/seedData.js';

const PORT = process.env.PORT || process.env.HOSPITAL_SERVICE_PORT || 5003;

const startServer = async () => {
  try {
    await connectDB();
    console.log(`[hospital-service] Connected to MongoDB database: ${process.env.HOSPITAL_DB_NAME || 'medimind_hospital'}`);

    // Seed canonical data if database is fresh
    await seedCanonicalData();

    const server = app.listen(PORT, () => {
      console.log(`[hospital-service] Running on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log('[hospital-service] Shutting down gracefully...');
      server.close(() => {
        console.log('[hospital-service] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[hospital-service] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
