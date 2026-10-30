import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { notificationConsumer } from './kafka/consumer.js';
import { notificationEurekaClient } from './eureka/client.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.NOTIFICATION_CONSUMER_PORT || '8002', 10);
const HOST = process.env.NOTIFICATION_CONSUMER_HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'MEDIMIND-NOTIFICATION-CONSUMER',
    role: 'Kafka Notification Event Consumer',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    eureka: notificationEurekaClient.getStatus(),
    kafka: notificationConsumer.getStatus(),
  });
});

const server = app.listen(PORT, HOST, async () => {
  console.log(`=======================================================`);
  console.log(` MediMind Notification Consumer running on http://localhost:${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(`=======================================================`);

  // Start Kafka consumer
  await notificationConsumer.start();

  // Register with Eureka
  await notificationEurekaClient.register();
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n[Notification Consumer] Received ${signal}. Initiating graceful shutdown...`);
  try {
    await notificationEurekaClient.deregister();
    await notificationConsumer.stop();
    server.close(() => {
      console.log('[Notification Consumer] HTTP server closed cleanly.');
      process.exit(0);
    });
  } catch (err) {
    console.error('[Notification Consumer] Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
