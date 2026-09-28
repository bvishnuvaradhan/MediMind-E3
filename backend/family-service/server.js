import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    await connectDB();
    console.log(`[family-service] Connected to MongoDB database: medimind_family`);

    const server = app.listen(PORT, () => {
      console.log(`[family-service] Running on port ${PORT}`);
    });

    const shutdown = async () => {
      console.log('[family-service] Shutting down gracefully...');
      server.close(() => {
        console.log('[family-service] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error(`[family-service] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
