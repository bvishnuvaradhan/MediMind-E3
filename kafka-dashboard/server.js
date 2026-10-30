import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Kafka } from 'kafkajs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PORT = parseInt(process.env.DASHBOARD_PORT || '8080', 10);
const HOST = process.env.DASHBOARD_HOST || '127.0.0.1';
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const EUREKA_SERVER_URL = process.env.EUREKA_SERVER_URL || 'http://127.0.0.1:8761';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Kafka client for dashboard telemetry
const kafka = new Kafka({
  clientId: 'medimind-kafka-dashboard',
  brokers: KAFKA_BROKERS,
  retry: { retries: 2 },
});

const admin = kafka.admin();

// Safe helper to connect admin client on demand
async function getAdminClient() {
  try {
    await admin.connect();
    return admin;
  } catch (err) {
    console.warn(`[KafkaDashboard] Admin connect warning: ${err.message}`);
    return null;
  }
}

/**
 * 1. Overview API
 */
app.get('/api/kafka/overview', async (req, res) => {
  try {
    const adm = await getAdminClient();
    if (!adm) {
      return res.status(200).json({
        connected: false,
        brokers: KAFKA_BROKERS,
        error: 'Kafka broker unreachable',
        brokersCount: 0,
        totalTopics: 0,
        totalPartitions: 0,
        totalMessages: 0,
        consumerGroupCount: 0,
      });
    }

    const cluster = await adm.describeCluster().catch(() => ({ brokers: [], controller: null, clusterId: null }));
    const topicsList = await adm.listTopics().catch(() => []);
    const groupsList = await adm.listGroups().catch(() => ({ groups: [] }));

    let totalPartitions = 0;
    let totalMessages = 0;

    if (topicsList.length > 0) {
      const metadata = await adm.fetchTopicMetadata({ topics: topicsList }).catch(() => ({ topics: [] }));
      for (const t of metadata.topics) {
        totalPartitions += (t.partitions || []).length;
      }

      // Fetch offsets for sample/active topics
      for (const topic of topicsList) {
        try {
          const offsets = await adm.fetchTopicOffsets(topic);
          for (const o of offsets) {
            const high = parseInt(o.high, 10) || 0;
            const low = parseInt(o.low, 10) || 0;
            totalMessages += Math.max(0, high - low);
          }
        } catch {
          // Ignore offset fetch failure for internal topics
        }
      }
    }

    // Query Eureka Server status as well
    let eurekaStatus = { available: false, servicesCount: 0, services: [] };
    try {
      const eurekaRes = await fetch(`${EUREKA_SERVER_URL.replace(/\/+$/, '')}/eureka/apps`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2000),
      });
      if (eurekaRes.ok) {
        const eurekaData = await eurekaRes.json();
        const apps = eurekaData.applications?.application || [];
        eurekaStatus = {
          available: true,
          servicesCount: apps.length,
          services: apps.map((a) => a.name),
        };
      }
    } catch {
      // Eureka offline or unreachable
    }

    return res.status(200).json({
      connected: true,
      brokers: KAFKA_BROKERS,
      brokersCount: cluster.brokers ? cluster.brokers.length : 1,
      clusterId: cluster.clusterId || 'kraft-cluster',
      controllerNode: cluster.controller,
      totalTopics: topicsList.length,
      topics: topicsList,
      totalPartitions,
      totalMessages,
      consumerGroupCount: groupsList.groups ? groupsList.groups.length : 0,
      eureka: eurekaStatus,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      connected: false,
      error: err.message,
    });
  }
});

/**
 * 2. Topics API
 */
app.get('/api/kafka/topics', async (req, res) => {
  try {
    const adm = await getAdminClient();
    if (!adm) {
      return res.status(503).json({ error: 'Kafka broker unreachable' });
    }

    const topicsList = await adm.listTopics();
    if (topicsList.length === 0) {
      return res.status(200).json({ topics: [] });
    }

    const metadata = await adm.fetchTopicMetadata({ topics: topicsList });
    const result = [];

    for (const t of metadata.topics) {
      let topicTotalMsgs = 0;
      let partitionDetails = [];

      try {
        const offsets = await adm.fetchTopicOffsets(t.name);
        partitionDetails = (t.partitions || []).map((p) => {
          const off = offsets.find((o) => o.partition === p.partitionId);
          const high = off ? parseInt(off.high, 10) : 0;
          const low = off ? parseInt(off.low, 10) : 0;
          const count = Math.max(0, high - low);
          topicTotalMsgs += count;
          return {
            partitionId: p.partitionId,
            leader: p.leader,
            replicas: p.replicas,
            isr: p.isr,
            lowOffset: low,
            highOffset: high,
            messageCount: count,
          };
        });
      } catch {
        partitionDetails = (t.partitions || []).map((p) => ({
          partitionId: p.partitionId,
          leader: p.leader,
          replicas: p.replicas,
          isr: p.isr,
          messageCount: 0,
        }));
      }

      result.push({
        name: t.name,
        partitionCount: (t.partitions || []).length,
        totalMessages: topicTotalMsgs,
        partitions: partitionDetails,
      });
    }

    return res.status(200).json({ topics: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Topic Messages API (Bounded, Non-Destructive Read with Redaction)
 */
app.get('/api/kafka/topics/:topic/messages', async (req, res) => {
  const { topic } = req.params;
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));

  // Ephemeral consumer with random group ID that never commits offsets
  const ephemeralGroupId = `dashboard-reader-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const consumer = kafka.consumer({ groupId: ephemeralGroupId });

  const messages = [];

  try {
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });

    let collected = 0;

    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve();
      }, 2500); // 2.5s window to collect recent messages

      consumer.run({
        autoCommit: false, // DO NOT alter application consumer offsets
        eachMessage: async ({ partition, message }) => {
          try {
            const raw = message.value ? message.value.toString('utf-8') : null;
            let parsed = null;
            try {
              parsed = JSON.parse(raw);
            } catch {
              parsed = { rawContent: raw };
            }

            // Sensitive data redaction policy: Mask patient-identifying data
            const sanitized = sanitizePayload(parsed);

            messages.push({
              offset: message.offset,
              partition,
              key: message.key ? message.key.toString('utf-8') : null,
              timestamp: message.timestamp ? new Date(parseInt(message.timestamp, 10)).toISOString() : null,
              eventId: sanitized.eventId || null,
              eventType: sanitized.eventType || 'Unknown',
              payload: sanitized,
            });

            collected++;
            if (collected >= limit * 2) {
              clearTimeout(timeout);
              resolve();
            }
          } catch (e) {
            // Ignore format errors
          }
        },
      });
    });

    await consumer.disconnect().catch(() => {});

    // Sort descending by offset/timestamp and take top 'limit'
    messages.sort((a, b) => parseInt(b.offset, 10) - parseInt(a.offset, 10));
    const recentMessages = messages.slice(0, limit);

    return res.status(200).json({
      topic,
      count: recentMessages.length,
      messages: recentMessages,
    });
  } catch (err) {
    await consumer.disconnect().catch(() => {});
    return res.status(500).json({ error: err.message, messages: [] });
  }
});

/**
 * 4. Consumer Groups API
 */
app.get('/api/kafka/consumer-groups', async (req, res) => {
  try {
    const adm = await getAdminClient();
    if (!adm) {
      return res.status(503).json({ error: 'Kafka broker unreachable' });
    }

    const { groups } = await adm.listGroups();
    if (!groups || groups.length === 0) {
      return res.status(200).json({ groups: [] });
    }

    const groupIds = groups.map((g) => g.groupId);
    const descriptions = await adm.describeGroups(groupIds).catch(() => ({ groups: [] }));

    const detailedGroups = (descriptions.groups || []).map((dg) => ({
      groupId: dg.groupId,
      protocol: dg.protocol,
      protocolType: dg.protocolType,
      state: dg.state,
      membersCount: (dg.members || []).length,
      members: (dg.members || []).map((m) => ({
        memberId: m.memberId,
        clientId: m.clientId,
        clientHost: m.clientHost,
      })),
    }));

    return res.status(200).json({ groups: detailedGroups });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Eureka Status API
 */
app.get('/api/eureka/status', async (req, res) => {
  try {
    const response = await fetch(`${EUREKA_SERVER_URL.replace(/\/+$/, '')}/eureka/apps`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return res.status(200).json({ online: false, error: `Eureka returned HTTP ${response.status}` });
    }

    const data = await response.json();
    const apps = data.applications?.application || [];

    const formattedApps = apps.map((app) => ({
      name: app.name,
      instances: (Array.isArray(app.instance) ? app.instance : [app.instance]).map((inst) => ({
        instanceId: inst.instanceId,
        hostName: inst.hostName,
        ipAddr: inst.ipAddr,
        port: inst.port?.$ || inst.port,
        status: inst.status,
        healthCheckUrl: inst.healthCheckUrl,
        homePageUrl: inst.homePageUrl,
      })),
    }));

    return res.status(200).json({
      online: true,
      serverUrl: EUREKA_SERVER_URL,
      servicesCount: formattedApps.length,
      applications: formattedApps,
    });
  } catch (err) {
    return res.status(200).json({
      online: false,
      serverUrl: EUREKA_SERVER_URL,
      error: err.message,
    });
  }
});

/**
 * Sanitize clinical fields for patient privacy & HIPAA compliance
 */
function sanitizePayload(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const clone = { ...obj };
  const sensitiveFields = ['password', 'token', 'secret', 'symptoms', 'clinical_notes', 'diagnosis', 'glucose', 'cholesterol'];

  for (const key of Object.keys(clone)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some((s) => lowerKey.includes(s))) {
      clone[key] = '[REDACTED_SENSITIVE_CLINICAL_DATA]';
    } else if (typeof clone[key] === 'object' && clone[key] !== null) {
      clone[key] = sanitizePayload(clone[key]);
    }
  }

  return clone;
}

// Fallback to React App
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Robust listener: Try 8080 first. If blocked by host service (NIApplicationWebServer), fallback cleanly to 8085.
function startDashboard(port) {
  const server = app.listen(port, HOST, () => {
    console.log(`=======================================================`);
    console.log(` MediMind Custom Kafka Monitoring Dashboard`);
    console.log(` URL: http://localhost:${port}`);
    console.log(` Kafka Brokers: ${KAFKA_BROKERS.join(', ')}`);
    console.log(` Eureka Server: ${EUREKA_SERVER_URL}`);
    console.log(`=======================================================`);
  });

  server.on('error', (err) => {
    if ((err.code === 'EACCES' || err.code === 'EADDRINUSE') && port === 8080) {
      console.warn(`[KafkaDashboard] Notice: Port 8080 is reserved on this host by system service NIApplicationWebServer.`);
      console.log(`[KafkaDashboard] Binding to fallback port 8085...`);
      startDashboard(8085);
    } else {
      console.error(`[KafkaDashboard] Server error:`, err);
    }
  });
}

startDashboard(DEFAULT_PORT);
