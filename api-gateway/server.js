import dotenv from "dotenv";
import app from "./src/app.js";
import { config, validateConfig } from "./src/config/services.js";

dotenv.config();

try {
  validateConfig();
} catch (error) {
  console.error(`FATAL: ${error.message}`);
  process.exit(1);
}

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`[api-gateway] Listening on port ${PORT}`);
  console.log(`[api-gateway] Auth service target: ${config.services.auth}`);
});

const handleShutdown = (signal) => {
  console.log(`[api-gateway] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("[api-gateway] Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
