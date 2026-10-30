/**
 * Eureka REST Client for MediMind Node.js API Gateway.
 * Manages service registration, periodic heartbeats, discovery, and deregistration.
 */

const EUREKA_HOST = process.env.EUREKA_HOST || '127.0.0.1';
const EUREKA_PORT = process.env.EUREKA_PORT || '8761';
const EUREKA_URL = `http://${EUREKA_HOST}:${EUREKA_PORT}/eureka`;

class EurekaClient {
  constructor() {
    this.appName = (process.env.SOA_SERVICE_NAME || 'MEDIMIND-API').toUpperCase();
    this.port = parseInt(process.env.SOA_GATEWAY_PORT || '5050', 10);
    this.hostName = process.env.SOA_GATEWAY_HOST || '127.0.0.1';
    this.ipAddr = process.env.SOA_GATEWAY_IP || '127.0.0.1';
    this.instanceId = `${this.ipAddr}:${this.appName.toLowerCase()}:${this.port}`;
    this.heartbeatIntervalMs = 10000; // 10s for responsive demonstration
    this.heartbeatTimer = null;
    this.isRegistered = false;
    this.lastHeartbeatTime = null;
    this.lastRegistrationTime = null;
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
      console.log(`[EurekaClient] Registering [${this.appName}] (${this.instanceId}) at ${url}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.status === 204 || response.status === 200) {
        this.isRegistered = true;
        this.lastRegistrationTime = new Date().toISOString();
        console.log(`[EurekaClient] Successfully registered [${this.appName}] with Eureka Server.`);
        this.startHeartbeat();
      } else {
        const text = await response.text();
        console.warn(`[EurekaClient] Registration response ${response.status}: ${text}`);
      }
    } catch (err) {
      console.error(`[EurekaClient] Failed to register with Eureka:`, err.message);
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
          // If instance was evicted or Eureka restarted, re-register
          console.log(`[EurekaClient] Instance expired in Eureka, re-registering...`);
          await this.register();
        }
      } catch (err) {
        console.warn(`[EurekaClient] Heartbeat failed: ${err.message}`);
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
      console.log(`[EurekaClient] Deregistering [${this.appName}] (${this.instanceId})...`);
      const response = await fetch(url, { method: 'DELETE' });
      if (response.status === 200 || response.status === 204) {
        console.log(`[EurekaClient] Successfully deregistered [${this.appName}].`);
      }
      this.isRegistered = false;
    } catch (err) {
      console.error(`[EurekaClient] Error during deregistration:`, err.message);
    }
  }

  async getDiscoveredServices() {
    try {
      const url = `${EUREKA_URL}/apps`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Eureka returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const apps = data.applications?.application || [];

      // Format clean service discovery response
      return apps.map((app) => ({
        name: app.name,
        instances: (Array.isArray(app.instance) ? app.instance : [app.instance]).map((inst) => ({
          instanceId: inst.instanceId,
          hostName: inst.hostName,
          ipAddr: inst.ipAddr,
          port: inst.port?.$ || inst.port,
          status: inst.status,
          healthCheckUrl: inst.healthCheckUrl,
          homePageUrl: inst.homePageUrl,
          lastUpdatedTimestamp: inst.lastUpdatedTimestamp,
        })),
      }));
    } catch (err) {
      console.error(`[EurekaClient] Error fetching service registry:`, err.message);
      return [];
    }
  }

  getStatus() {
    return {
      registered: this.isRegistered,
      eurekaUrl: EUREKA_URL,
      appName: this.appName,
      instanceId: this.instanceId,
      lastRegistrationTime: this.lastRegistrationTime,
      lastHeartbeatTime: this.lastHeartbeatTime,
    };
  }
}

export const eurekaClient = new EurekaClient();
