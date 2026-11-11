import { Kafka, Partitioners } from 'kafkajs';
import crypto from 'crypto';

const CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'medimind-backend';

export function isKafkaEnabled() {
  if (
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NODE_ENV === 'production' ||
    process.env.NODE_ENV === 'test' ||
    process.env.KAFKA_ENABLED === 'false'
  ) {
    return false;
  }
  return process.env.KAFKA_ENABLED === 'true' || Boolean(process.env.KAFKA_BROKERS);
}

class ResilientKafkaProducer {
  constructor() {
    this.kafka = null;
    this.producer = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.brokers = [];
  }

  _ensureClient() {
    if (this.producer) return true;
    const rawBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
    this.brokers = rawBrokers.split(',').map((b) => b.trim()).filter(Boolean);
    if (this.brokers.length === 0) return false;
    this.kafka = new Kafka({
      clientId: CLIENT_ID,
      brokers: this.brokers,
      retry: {
        initialRetryTime: 300,
        retries: 3,
      },
    });
    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
    return true;
  }

  async connect() {
    if (!isKafkaEnabled() || this.isConnected || this.isConnecting) return;
    if (!this._ensureClient()) return;
    this.isConnecting = true;
    try {
      await this.producer.connect();
      this.isConnected = true;
    } catch (err) {
      this.isConnected = false;
      console.warn(`[KafkaProducer] Kafka connection not available (${err.message}).`);
    } finally {
      this.isConnecting = false;
    }
  }

  async publish(topic, event) {
    if (!isKafkaEnabled()) return;
    try {
      if (!this.isConnected) {
        await this.connect();
      }
      if (!this.isConnected || !this.producer) return;

      const envelope = {
        eventId: event.eventId || crypto.randomUUID(),
        eventType: event.eventType,
        timestamp: event.timestamp || new Date().toISOString(),
        source: event.source || 'medimind-backend',
        ...event,
      };

      await this.producer.send({
        topic,
        messages: [
          {
            key: String(envelope.patientId || envelope.appointmentId || envelope.recipientId || envelope.eventId),
            value: JSON.stringify(envelope),
            headers: {
              eventType: String(envelope.eventType),
              source: String(envelope.source),
              timestamp: String(envelope.timestamp),
            },
          },
        ],
      });
    } catch (err) {
      console.warn(`[KafkaProducer] Asynchronous publish failed for topic ${topic} (${err.message}) - application unaffected.`);
    }
  }

  publishPrediction({ patientId, predictionId, predictionType, riskLevel, source = 'ai-prediction' }) {
    return this.publish('medimind.predictions', {
      eventType: 'PredictionCompleted',
      patientId: patientId ? String(patientId) : undefined,
      predictionId: predictionId ? String(predictionId) : undefined,
      predictionType: String(predictionType).toUpperCase(),
      riskLevel: riskLevel ? String(riskLevel).toUpperCase() : undefined,
      source,
    });
  }

  async disconnect() {
    if (!this.isConnected || !this.producer) return;
    try {
      await this.producer.disconnect();
      this.isConnected = false;
    } catch {
      // Ignore on exit
    }
  }
}

export const kafkaProducer = new ResilientKafkaProducer();
