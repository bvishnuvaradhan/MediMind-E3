import '../load-env.js';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || process.env.RECORD_SERVICE_PORT || 5006;

const startServer = async () => {
  try {
    await connectDB();
    console.log(`[medical-record-service] Connected to MongoDB database: ${process.env.RECORD_DB_NAME || 'medimind_records'}`);

    const server = app.listen(PORT, () => {
      console.log(`[medical-record-service] Running on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log('[medical-record-service] Shutting down gracefully...');
      server.close(() => {
        console.log('[medical-record-service] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[medical-record-service] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
