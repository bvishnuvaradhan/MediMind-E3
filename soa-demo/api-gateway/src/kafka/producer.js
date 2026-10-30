import { Kafka, Partitioners } from 'kafkajs';

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'medimind-api-gateway';

class KafkaProducerService {
  constructor() {
    this.kafka = new Kafka({
      clientId: CLIENT_ID,
      brokers: KAFKA_BROKERS,
      retry: {
        initialRetryTime: 300,
        retries: 5,
      },
    });

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
    this.isConnected = false;
  }

  async connect() {
    if (this.isConnected) return;
    try {
      console.log(`[KafkaProducer] Connecting to Kafka brokers: ${KAFKA_BROKERS.join(', ')}...`);
      await this.producer.connect();
      this.isConnected = true;
      console.log('[KafkaProducer] Connected successfully to Apache Kafka.');
    } catch (err) {
      console.error('[KafkaProducer] Error connecting to Kafka:', err.message);
      this.isConnected = false;
      throw err;
    }
  }

  async disconnect() {
    if (!this.isConnected) return;
    try {
      console.log('[KafkaProducer] Disconnecting producer...');
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('[KafkaProducer] Disconnected.');
    } catch (err) {
      console.error('[KafkaProducer] Error disconnecting producer:', err.message);
    }
  }

  async publishEvent(topic, event) {
    if (!this.isConnected) {
      await this.connect();
    }

    const payload = {
      topic,
      messages: [
        {
          key: event.patientId || event.recipientId || event.eventId || 'demo-key',
          value: JSON.stringify(event),
          headers: {
            source: event.source || 'medimind-api',
            eventType: event.eventType,
            timestamp: event.timestamp || new Date().toISOString(),
          },
        },
      ],
    };

    console.log(`[KafkaProducer] Publishing event [${event.eventType}] (ID: ${event.eventId}) to topic [${topic}]`);
    const recordMetadata = await this.producer.send(payload);
    return recordMetadata;
  }

  getStatus() {
    return {
      connected: this.isConnected,
      brokers: KAFKA_BROKERS,
      clientId: CLIENT_ID,
    };
  }
}

export const kafkaProducer = new KafkaProducerService();
