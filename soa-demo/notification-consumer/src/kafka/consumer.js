import { Kafka } from 'kafkajs';

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const GROUP_ID = process.env.KAFKA_GROUP_ID || 'medimind-notification-group';
const TOPIC = process.env.KAFKA_TOPIC || 'medimind.notifications';

class NotificationConsumerService {
  constructor() {
    this.kafka = new Kafka({
      clientId: 'medimind-notification-consumer',
      brokers: KAFKA_BROKERS,
      retry: {
        initialRetryTime: 300,
        retries: 8,
      },
    });

    this.consumer = this.kafka.consumer({ groupId: GROUP_ID });
    this.isConnected = false;
    this.processedCount = 0;
    this.lastEvent = null;
    this.seenEventIds = new Set();
  }

  async start() {
    try {
      console.log(`[NotificationConsumer] Connecting to Kafka brokers: ${KAFKA_BROKERS.join(', ')}...`);
      await this.consumer.connect();
      this.isConnected = true;
      console.log(`[NotificationConsumer] Connected to Kafka. Subscribing to topic: ${TOPIC}`);

      await this.consumer.subscribe({ topic: TOPIC, fromBeginning: true });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const rawValue = message.value.toString();
            const event = JSON.parse(rawValue);
            this.handleEvent(event);
          } catch (err) {
            console.error('[NotificationConsumer] Failed to parse notification message:', err.message);
          }
        },
      });
    } catch (err) {
      console.error('[NotificationConsumer] Error in consumer lifecycle:', err.message);
      this.isConnected = false;
    }
  }

  handleEvent(event) {
    const { eventId, eventType, recipientId, channel, message, timestamp, source } = event;

    // Duplicate event protection
    if (eventId && this.seenEventIds.has(eventId)) {
      console.log(`[NotificationConsumer] Duplicate event detected (ID: ${eventId}), skipping.`);
      return;
    }

    if (eventId) {
      this.seenEventIds.add(eventId);
      if (this.seenEventIds.size > 10000) this.seenEventIds.clear();
    }

    this.processedCount += 1;
    this.lastEvent = {
      eventId,
      eventType,
      recipientId,
      channel,
      message,
      timestamp,
      source,
      processedAt: new Date().toISOString(),
      status: 'DELIVERED_DEMO',
    };

    console.log('='.repeat(70));
    console.log('[DEMO-SOA-NOTIFICATION-CONSUMER] Asynchronous Notification Event Received:');
    console.log(`   -> Event ID:     ${eventId}`);
    console.log(`   -> Event Type:   ${eventType}`);
    console.log(`   -> Recipient ID: ${recipientId}`);
    console.log(`   -> Channel:      ${channel}`);
    console.log(`   -> Message:      "${message}"`);
    console.log(`   -> Timestamp:    ${timestamp}`);
    console.log('[DEMO-SOA-NOTIFICATION-CONSUMER] Simulated dispatch: Notification logged successfully.');
    console.log('[DEMO-SOA-NOTIFICATION-CONSUMER] NOTE: Demonstration mode: No real patient notifications dispatched.');
    console.log('='.repeat(70));
  }

  async stop() {
    try {
      console.log('[NotificationConsumer] Disconnecting Kafka consumer...');
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('[NotificationConsumer] Consumer disconnected.');
    } catch (err) {
      console.error('[NotificationConsumer] Error stopping consumer:', err.message);
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      topic: TOPIC,
      groupId: GROUP_ID,
      processedCount: this.processedCount,
      lastEvent: this.lastEvent,
    };
  }
}

export const notificationConsumer = new NotificationConsumerService();
