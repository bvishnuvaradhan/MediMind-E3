/**
 * MediMind Resilient Apache Kafka Publisher.
 *
 * Provides non-blocking, safe event publishing to real MediMind Kafka topics:
 * - medimind.predictions
 * - medimind.appointments
 * - medimind.notifications
 *
 * Operations are strictly non-blocking: failure to publish never delays or fails
 * the synchronous clinical or booking HTTP request.
 */

import { Kafka, Partitioners } from 'kafkajs';
import crypto from 'crypto';

const CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'medimind-backend';

export function isKafkaEnabled() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
    return false;
  }
  if (process.env.KAFKA_ENABLED === 'false') {
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
    if (!isKafkaEnabled()) return;
    if (this.isConnected || this.isConnecting) return;
    if (!this._ensureClient()) return;
    this.isConnecting = true;
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log(`[KafkaProducer] Connected to Kafka cluster (${this.brokers.join(', ')})`);
    } catch (err) {
      this.isConnected = false;
      console.warn(`[KafkaProducer] Kafka connection not available (${err.message}). Messaging will retry asynchronously.`);
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Safe, fire-and-forget message publishing. Never throws.
   */
  async publish(topic, event) {
    if (!isKafkaEnabled()) {
      return;
    }
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.isConnected || !this.producer) {
        // Still not connected, drop silently to preserve synchronous clinical workflow
        return;
      }

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

      console.log(`[KafkaProducer] Published event [${envelope.eventType}] (ID: ${envelope.eventId}) -> topic: ${topic}`);
    } catch (err) {
      console.warn(`[KafkaProducer] Asynchronous publish failed for topic ${topic} (${err.message}) - application unaffected.`);
    }
  }

  /**
   * Publish prediction lifecycle event
   */
  publishPrediction({ patientId, predictionId, predictionType, riskLevel, source = 'ai-prediction' }) {
    // Redact patient-sensitive data (only IDs & categorical summary)
    return this.publish('medimind.predictions', {
      eventType: 'PredictionCompleted',
      patientId: patientId ? String(patientId) : undefined,
      predictionId: predictionId ? String(predictionId) : undefined,
      predictionType: String(predictionType).toUpperCase(),
      riskLevel: riskLevel ? String(riskLevel).toUpperCase() : undefined,
      source,
    });
  }

  /**
   * Publish appointment booking/cancellation event
   */
  publishAppointment({ appointmentId, patientId, doctorId, departmentId, hospitalId, status = 'BOOKED', source = 'appointment-service' }) {
    return this.publish('medimind.appointments', {
      eventType: status === 'CANCELLED' ? 'AppointmentCancelled' : 'AppointmentBooked',
      appointmentId: String(appointmentId),
      patientId: patientId ? String(patientId) : undefined,
      doctorId: doctorId ? String(doctorId) : undefined,
      departmentId: departmentId ? String(departmentId) : undefined,
      hospitalId: hospitalId ? String(hospitalId) : undefined,
      status,
      source,
    });
  }

  /**
   * Publish notification event
   */
  publishNotification({ recipientId, channel = 'IN_APP', title, source = 'appointment-service' }) {
    return this.publish('medimind.notifications', {
      eventType: 'NotificationGenerated',
      recipientId: String(recipientId),
      channel: String(channel).toUpperCase(),
      title: title ? String(title) : 'MediMind Notice',
      source,
    });
  }

  async disconnect() {
    if (!this.isConnected) return;
    try {
      await this.producer.disconnect();
      this.isConnected = false;
    } catch (err) {
      // Ignore on exit
    }
  }
}

export const kafkaProducer = new ResilientKafkaProducer();
