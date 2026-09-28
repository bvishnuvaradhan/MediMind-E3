import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import { connectDB } from './src/config/db.js';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    console.log(`[auth-service] Connected to MongoDB at ${process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medimind_auth'}`);

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
