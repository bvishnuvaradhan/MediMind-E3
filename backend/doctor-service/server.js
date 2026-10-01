import '../load-env.js';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { seedCanonicalDoctors } from './src/utils/seedData.js';

const PORT = process.env.PORT || process.env.DOCTOR_SERVICE_PORT || 5004;

const startServer = async () => {
  try {
    await connectDB();
    console.log(`[doctor-service] Connected to MongoDB database: ${process.env.DOCTOR_DB_NAME || 'medimind_doctor'}`);

    // Seed canonical doctor records if collection is empty
    await seedCanonicalDoctors();

    const server = app.listen(PORT, () => {
      console.log(`[doctor-service] Running on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log('[doctor-service] Shutting down gracefully...');
      server.close(() => {
        console.log('[doctor-service] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[doctor-service] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
