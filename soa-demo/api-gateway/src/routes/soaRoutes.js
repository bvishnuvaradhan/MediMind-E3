import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { kafkaProducer } from '../kafka/producer.js';
import { eurekaClient } from '../eureka/client.js';

const router = Router();

// Allowed demo prediction types
const VALID_PREDICTION_TYPES = ['HEART_DISEASE', 'DIABETES', 'GENERAL_HEALTH', 'FRACTURE'];

/**
 * POST /api/soa/predictions
 * Publishes a prediction-requested demonstration event to Kafka topic medimind.predictions
 */
router.post('/predictions', async (req, res) => {
  try {
    const { patientId = 'DEMO-001', predictionType = 'HEART_DISEASE', metadata = {} } = req.body || {};

    const event = {
      eventId: req.body?.eventId || uuidv4(),
      eventType: 'PredictionRequested',
      patientId: String(patientId),
      predictionType: String(predictionType).toUpperCase(),
      timestamp: new Date().toISOString(),
      source: 'medimind-api',
      metadata: {
        ...metadata,
        environment: 'soa-demonstration',
        isDemo: true,
      },
    };

    const recordMetadata = await kafkaProducer.publishEvent('medimind.predictions', event);

    res.status(202).json({
      success: true,
      message: 'Demonstration prediction event published to Kafka successfully',
      topic: 'medimind.predictions',
      event,
      kafkaMetadata: recordMetadata,
    });
  } catch (err) {
    console.error('[SOA Gateway] Error publishing prediction event:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to publish prediction event to Kafka',
      details: err.message,
    });
  }
});

/**
 * POST /api/soa/notifications
 * Publishes a notification-requested demonstration event to Kafka topic medimind.notifications
 */
router.post('/notifications', async (req, res) => {
  try {
    const {
      recipientId = 'DEMO-001',
      channel = 'EMAIL',
      message = 'MediMind Notification: Upcoming clinical consultation reminder.',
      metadata = {},
    } = req.body || {};

    const event = {
      eventId: req.body?.eventId || uuidv4(),
      eventType: 'NotificationRequested',
      recipientId: String(recipientId),
      channel: String(channel).toUpperCase(),
      message: String(message),
      timestamp: new Date().toISOString(),
      source: 'medimind-api',
      metadata: {
        ...metadata,
        environment: 'soa-demonstration',
        isDemo: true,
      },
    };

    const recordMetadata = await kafkaProducer.publishEvent('medimind.notifications', event);

    res.status(202).json({
      success: true,
      message: 'Demonstration notification event published to Kafka successfully',
      topic: 'medimind.notifications',
      event,
      kafkaMetadata: recordMetadata,
    });
  } catch (err) {
    console.error('[SOA Gateway] Error publishing notification event:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to publish notification event to Kafka',
      details: err.message,
    });
  }
});

/**
 * POST /api/soa/appointments
 * Publishes an appointment demonstration event to Kafka topic medimind.appointments
 */
router.post('/appointments', async (req, res) => {
  try {
    const {
      patientId = 'DEMO-001',
      appointmentId = `APT-${Date.now().toString().slice(-6)}`,
      department = 'Cardiology',
      metadata = {},
    } = req.body || {};

    const event = {
      eventId: req.body?.eventId || uuidv4(),
      eventType: 'AppointmentBooked',
      patientId: String(patientId),
      appointmentId: String(appointmentId),
      department: String(department),
      timestamp: new Date().toISOString(),
      source: 'medimind-api',
      metadata: {
        ...metadata,
        environment: 'soa-demonstration',
        isDemo: true,
      },
    };

    const recordMetadata = await kafkaProducer.publishEvent('medimind.appointments', event);

    res.status(202).json({
      success: true,
      message: 'Demonstration appointment event published to Kafka successfully',
      topic: 'medimind.appointments',
      event,
      kafkaMetadata: recordMetadata,
    });
  } catch (err) {
    console.error('[SOA Gateway] Error publishing appointment event:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to publish appointment event to Kafka',
      details: err.message,
    });
  }
});

/**
 * GET /api/soa/services
 * Returns registered microservices dynamically queried from Netflix Eureka Server
 */
router.get('/services', async (req, res) => {
  try {
    const services = await eurekaClient.getDiscoveredServices();
    res.status(200).json({
      success: true,
      count: services.length,
      registry: services,
      eurekaUrl: eurekaClient.getStatus().eurekaUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[SOA Gateway] Error querying Eureka services:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to query Eureka registry',
      details: err.message,
    });
  }
});

/**
 * GET /api/soa/status
 * Returns Kafka connection status, service registration status, and demonstration service health
 */
router.get('/status', async (req, res) => {
  const kafkaStatus = kafkaProducer.getStatus();
  const eurekaStatus = eurekaClient.getStatus();

  const isHealthy = kafkaStatus.connected && eurekaStatus.registered;

  res.status(200).json({
    success: true,
    status: isHealthy ? 'UP' : 'PARTIAL',
    service: 'MEDIMIND-API',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    kafka: kafkaStatus,
    eureka: eurekaStatus,
    topics: ['medimind.predictions', 'medimind.appointments', 'medimind.notifications'],
  });
});

export default router;
