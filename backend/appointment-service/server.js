import '../load-env.js';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || process.env.APPOINTMENT_SERVICE_PORT || 5005;

const startServer = async () => {
  try {
    await connectDB();
    console.log(`[appointment-service] Connected to MongoDB database: ${process.env.APPOINTMENT_DB_NAME || 'medimind_appointment'}`);

    const server = app.listen(PORT, () => {
      console.log(`[appointment-service] Running on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log('[appointment-service] Shutting down gracefully...');
      server.close(() => {
        console.log('[appointment-service] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[appointment-service] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
