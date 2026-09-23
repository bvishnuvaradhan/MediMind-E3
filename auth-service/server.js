import dotenv from "dotenv";
import app from "./src/app.js";
import { connectDB, disconnectDB } from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

// Validate essential secrets at startup
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim().length === 0) {
  console.error("FATAL: JWT_SECRET environment variable is required and must not be empty.");
  process.exit(1);
}

if ((!process.env.MONGODB_URI || process.env.MONGODB_URI.trim().length === 0) &&
    (!process.env.MONGO_URI || process.env.MONGO_URI.trim().length === 0)) {
  console.error("FATAL: MONGODB_URI (or MONGO_URI) environment variable is required and must not be empty.");
  process.exit(1);
}

let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`[auth-service] Listening on port ${PORT}`);
    });
  } catch (error) {
    console.error(`[auth-service] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

const handleShutdown = async (signal) => {
  console.log(`[auth-service] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      console.log("[auth-service] Server closed.");
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

startServer();
