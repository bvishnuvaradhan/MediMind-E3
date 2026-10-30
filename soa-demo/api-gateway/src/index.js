import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import soaRoutes from './routes/soaRoutes.js';
import { kafkaProducer } from './kafka/producer.js';
import { eurekaClient } from './eureka/client.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.SOA_GATEWAY_PORT || '5050', 10);
const HOST = process.env.SOA_GATEWAY_HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

// Root health check endpoint as requested
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'MEDIMIND-API',
    role: 'API Gateway & SOA Event Producer',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    kafka: kafkaProducer.getStatus(),
    eureka: eurekaClient.getStatus(),
  });
});

// SOA demonstration endpoints
app.use('/api/soa', soaRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('[SOA Gateway Error]:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message,
  });
});

const server = app.listen(PORT, HOST, async () => {
  console.log(`=======================================================`);
  console.log(` MediMind SOA API Gateway listening on http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` SOA Status:   http://localhost:${PORT}/api/soa/status`);
  console.log(` Discovery:    http://localhost:${PORT}/api/soa/services`);
  console.log(`=======================================================`);

  // Connect to Kafka producer
  try {
    await kafkaProducer.connect();
  } catch (err) {
    console.warn('[SOA Gateway] Initial Kafka connection failed. Will retry on demand.');
  }

  // Register with Eureka Server
  try {
    await eurekaClient.register();
  } catch (err) {
    console.warn('[SOA Gateway] Initial Eureka registration failed. Will retry periodically.');
  }
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n[SOA Gateway] Received ${signal}. Initiating graceful shutdown...`);
  try {
    await eurekaClient.deregister();
    await kafkaProducer.disconnect();
    server.close(() => {
      console.log('[SOA Gateway] HTTP server closed cleanly.');
      process.exit(0);
    });
  } catch (err) {
    console.error('[SOA Gateway] Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
