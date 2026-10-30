/**
 * Eureka REST Client for MediMind Node.js Notification Consumer.
 */

const EUREKA_HOST = process.env.EUREKA_HOST || '127.0.0.1';
const EUREKA_PORT = process.env.EUREKA_PORT || '8761';
const EUREKA_URL = `http://${EUREKA_HOST}:${EUREKA_PORT}/eureka`;

class EurekaNotificationClient {
  constructor() {
    this.appName = (process.env.NOTIFICATION_SERVICE_NAME || 'MEDIMIND-NOTIFICATION-CONSUMER').toUpperCase();
    this.port = parseInt(process.env.NOTIFICATION_CONSUMER_PORT || '8002', 10);
    this.hostName = process.env.NOTIFICATION_CONSUMER_HOST || '127.0.0.1';
    this.ipAddr = process.env.NOTIFICATION_CONSUMER_IP || '127.0.0.1';
    this.instanceId = `${this.ipAddr}:${this.appName.toLowerCase()}:${this.port}`;
    this.heartbeatIntervalMs = 10000;
    this.heartbeatTimer = null;
    this.isRegistered = false;
    this.lastHeartbeatTime = null;
  }

  getInstancePayload() {
    const now = String(Date.now());
    return {
      instance: {
        instanceId: this.instanceId,
        hostName: this.hostName,
        app: this.appName,
        ipAddr: this.ipAddr,
        status: 'UP',
        overriddenstatus: 'UNKNOWN',
        port: {
          $: this.port,
          '@enabled': 'true',
        },
        securePort: {
          $: 9443,
          '@enabled': 'false',
        },
        countryId: 1,
        dataCenterInfo: {
          '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
          name: 'MyOwn',
        },
        leaseInfo: {
          renewalIntervalInSecs: 10,
          durationInSecs: 30,
          registrationTimestamp: 0,
          lastRenewalTimestamp: 0,
          evictionTimestamp: 0,
          serviceUpTimestamp: 0,
        },
        metadata: {
          'management.port': String(this.port),
          zone: 'default',
        },
        homePageUrl: `http://${this.hostName}:${this.port}/`,
        statusPageUrl: `http://${this.hostName}:${this.port}/health`,
        healthCheckUrl: `http://${this.hostName}:${this.port}/health`,
        secureHealthCheckUrl: '',
        vipAddress: this.appName.toLowerCase(),
        secureVipAddress: this.appName.toLowerCase(),
        isCoordinatingDiscoveryServer: 'false',
        lastUpdatedTimestamp: now,
        lastDirtyTimestamp: now,
      },
    };
  }

  async register() {
    const url = `${EUREKA_URL}/apps/${this.appName}`;
    const payload = this.getInstancePayload();

    try {
      console.log(`[NotificationEureka] Registering [${this.appName}] (${this.instanceId}) at ${url}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 204 || response.status === 200) {
        this.isRegistered = true;
        console.log(`[NotificationEureka] Successfully registered [${this.appName}] with Eureka.`);
        this.startHeartbeat();
      } else {
        const text = await response.text();
        console.warn(`[NotificationEureka] Registration status ${response.status}: ${text}`);
      }
    } catch (err) {
      console.error(`[NotificationEureka] Failed to register:`, err.message);
      this.isRegistered = false;
    }
  }

  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(async () => {
      try {
        const now = Date.now();
        const url = `${EUREKA_URL}/apps/${this.appName}/${encodeURIComponent(this.instanceId)}?status=UP&lastDirtyTimestamp=${now}`;
        const response = await fetch(url, { method: 'PUT' });

        if (response.status === 200) {
          this.lastHeartbeatTime = new Date().toISOString();
        } else if (response.status === 404) {
          console.log(`[NotificationEureka] Instance expired in Eureka, re-registering...`);
          await this.register();
        }
      } catch (err) {
        console.warn(`[NotificationEureka] Heartbeat failed: ${err.message}`);
      }
    }, this.heartbeatIntervalMs);
  }

  async deregister() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (!this.isRegistered) return;

    try {
      const url = `${EUREKA_URL}/apps/${this.appName}/${encodeURIComponent(this.instanceId)}`;
      console.log(`[NotificationEureka] Deregistering [${this.appName}]...`);
      const response = await fetch(url, { method: 'DELETE' });
      if (response.status === 200 || response.status === 204) {
        console.log(`[NotificationEureka] Successfully deregistered [${this.appName}].`);
      }
      this.isRegistered = false;
    } catch (err) {
      console.error(`[NotificationEureka] Deregistration error:`, err.message);
    }
  }

  getStatus() {
    return {
      registered: this.isRegistered,
      eurekaUrl: EUREKA_URL,
      appName: this.appName,
      instanceId: this.instanceId,
      lastHeartbeatTime: this.lastHeartbeatTime,
    };
  }
}

export const notificationEurekaClient = new EurekaNotificationClient();
