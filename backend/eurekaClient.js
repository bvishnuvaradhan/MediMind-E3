/**
 * Universal Netflix Eureka Registration Client for MediMind Node.js Microservices.
 *
 * Automatically registers the host service with Netflix Eureka Server (default port 8761),
 * runs periodic heartbeats, automatically retries on network failures,
 * handles graceful shutdown/deregistration, and never crashes the host application.
 */

const EUREKA_SERVER_URL = process.env.EUREKA_SERVER_URL || 'http://127.0.0.1:8761';
const EUREKA_URL = `${EUREKA_SERVER_URL.replace(/\/+$/, '')}/eureka`;

export class EurekaServiceRegistry {
  constructor({ appName, port, host = '127.0.0.1', healthPath = '/health' }) {
    this.appName = String(appName).toUpperCase();
    this.port = parseInt(port, 10);
    this.host = host;
    this.healthPath = healthPath;
    this.instanceId = `${this.host}:${this.appName.toLowerCase()}:${this.port}`;
    this.heartbeatIntervalMs = 4000;  // 4s heartbeat (under Eureka 10s eviction threshold)
    this.retryIntervalMs = 5000;      // 5s retry if Eureka is offline
    this.heartbeatTimer = null;
    this.retryTimer = null;
    this.isRegistered = false;
    this.isShuttingDown = false;
    this.lastHeartbeatTime = null;
  }

  getInstancePayload() {
    const now = String(Date.now());
    return {
      instance: {
        instanceId: this.instanceId,
        hostName: this.host,
        app: this.appName,
        ipAddr: this.host,
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
        homePageUrl: `http://${this.host}:${this.port}/`,
        statusPageUrl: `http://${this.host}:${this.port}${this.healthPath}`,
        healthCheckUrl: `http://${this.host}:${this.port}${this.healthPath}`,
        secureHealthCheckUrl: '',
        vipAddress: this.appName.toLowerCase(),
        secureVipAddress: this.appName.toLowerCase(),
        isCoordinatingDiscoveryServer: 'false',
        lastUpdatedTimestamp: now,
        lastDirtyTimestamp: now,
      },
    };
  }

  async start() {
    if (this.isShuttingDown) return;
    await this.register();

    // Attach graceful shutdown hooks
    const onExit = async () => {
      await this.stop();
    };

    process.once('SIGINT', onExit);
    process.once('SIGTERM', onExit);
  }

  async register() {
    if (this.isShuttingDown) return false;
    const url = `${EUREKA_URL}/apps/${encodeURIComponent(this.appName)}`;
    const payload = this.getInstancePayload();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      if (response.status === 204 || response.status === 200) {
        this.isRegistered = true;
        console.log(`[EurekaClient:${this.appName}] Successfully registered with Eureka at ${EUREKA_SERVER_URL}`);
        this.clearRetryTimer();
        this.startHeartbeat();
        return true;
      } else {
        const text = await response.text();
        console.warn(`[EurekaClient:${this.appName}] Registration response HTTP ${response.status}: ${text}`);
        this.scheduleRetry();
        return false;
      }
    } catch (err) {
      console.warn(`[EurekaClient:${this.appName}] Eureka server unreachable (${err.message}). Will retry in ${this.retryIntervalMs / 1000}s without blocking service.`);
      this.isRegistered = false;
      this.scheduleRetry();
      return false;
    }
  }

  scheduleRetry() {
    if (this.isShuttingDown || this.retryTimer || this.isRegistered) return;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.register().catch(() => {});
    }, this.retryIntervalMs);
  }

  clearRetryTimer() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(async () => {
      if (this.isShuttingDown) return;
      try {
        const now = Date.now();
        const url = `${EUREKA_URL}/apps/${encodeURIComponent(this.appName)}/${encodeURIComponent(this.instanceId)}?status=UP&lastDirtyTimestamp=${now}`;
        const response = await fetch(url, {
          method: 'PUT',
          signal: AbortSignal.timeout(4000),
        });

        if (response.status === 200) {
          this.lastHeartbeatTime = new Date().toISOString();
        } else if (response.status === 404) {
          console.log(`[EurekaClient:${this.appName}] Lease expired in Eureka, re-registering...`);
          await this.register();
        }
      } catch (err) {
        console.warn(`[EurekaClient:${this.appName}] Heartbeat missed (${err.message}). Retrying on next cycle.`);
      }
    }, this.heartbeatIntervalMs);
  }

  async stop() {
    this.isShuttingDown = true;
    this.clearRetryTimer();
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (!this.isRegistered) return;

    try {
      const url = `${EUREKA_URL}/apps/${encodeURIComponent(this.appName)}/${encodeURIComponent(this.instanceId)}`;
      console.log(`[EurekaClient:${this.appName}] Deregistering from Eureka...`);
      await fetch(url, {
        method: 'DELETE',
        signal: AbortSignal.timeout(3000),
      });
      this.isRegistered = false;
      console.log(`[EurekaClient:${this.appName}] Deregistered cleanly.`);
    } catch (err) {
      console.warn(`[EurekaClient:${this.appName}] Deregistration error: ${err.message}`);
    }
  }

  getStatus() {
    return {
      appName: this.appName,
      instanceId: this.instanceId,
      registered: this.isRegistered,
      serverUrl: EUREKA_SERVER_URL,
      port: this.port,
      lastHeartbeatTime: this.lastHeartbeatTime,
    };
  }
}

/**
 * Helper to initialize Eureka registration with non-blocking resilience.
 */
export function registerServiceWithEureka({ appName, port, host = '127.0.0.1', healthPath = '/health' }) {
  const client = new EurekaServiceRegistry({ appName, port, host, healthPath });
  client.start().catch((err) => {
    console.warn(`[EurekaClient:${appName}] Background registration error: ${err.message}`);
  });
  return client;
}
