import crypto from 'crypto';

const CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'medimind-appointment-service';

export function isKafkaEnabled() {
  if (
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NODE_ENV === 'production' ||
    process.env.NODE_ENV === 'test'
  ) {
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

  async _ensureClient() {
    if (this.producer) return true;
    const rawBrokers = process.env.KAFKA_BROKERS || 'localhost:9092';
    this.brokers = rawBrokers.split(',').map((b) => b.trim()).filter(Boolean);
    if (this.brokers.length === 0) return false;
    const { Kafka, Partitioners } = await import('kafkajs');
    this.kafka = new Kafka({
      clientId: CLIENT_ID,
      brokers: this.brokers,
      retry: { initialRetryTime: 300, retries: 3 },
    });
    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
    return true;
  }

  async connect() {
    if (!isKafkaEnabled() || this.isConnected || this.isConnecting) return;
    this.isConnecting = true;
    try {
      const ready = await this._ensureClient();
      if (!ready) return;
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
      if (!this.isConnected) await this.connect();
      if (!this.isConnected || !this.producer) return;
      const envelope = {
        eventId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        topic,
        ...event,
      };
      await this.producer.send({
        topic,
        messages: [{ key: envelope.eventId, value: JSON.stringify(envelope) }],
      });
    } catch (err) {
      this.isConnected = false;
      console.warn(`[KafkaProducer] Publish failed on topic ${topic} (${err.message}).`);
    }
  }

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
    if (!this.isConnected || !this.producer) return;
    try {
      await this.producer.disconnect();
      this.isConnected = false;
    } catch {
      // Ignore cleanup errors
    }
  }
}

export const kafkaProducer = new ResilientKafkaProducer();
