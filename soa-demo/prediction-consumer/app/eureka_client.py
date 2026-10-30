"""
Netflix Eureka REST Client for Python AI Prediction Consumer.
Handles registration, heartbeat, discovery, and deregistration.
"""

import time
import threading
import logging
import requests

logger = logging.getLogger("eureka_client")
logging.basicConfig(level=logging.INFO)

class EurekaClientAdapter:
    def __init__(self, eureka_server="http://127.0.0.1:8761", app_name="MEDIMIND-AI-CONSUMER", port=8001, host="127.0.0.1"):
        self.eureka_server = eureka_server.rstrip('/')
        self.app_name = app_name.upper()
        self.port = port
        self.host = host
        self.instance_id = f"{self.host}:{self.app_name.lower()}:{self.port}"
        self.registered = False
        self._stop_heartbeat = threading.Event()
        self._heartbeat_thread = None
        self.last_heartbeat = None

    def get_instance_payload(self):
        now_str = str(int(time.time() * 1000))
        return {
            "instance": {
                "instanceId": self.instance_id,
                "hostName": self.host,
                "app": self.app_name,
                "ipAddr": self.host,
                "port": {
                    "$": self.port,
                    "@enabled": "true"
                },
                "securePort": {
                    "$": 9443,
                    "@enabled": "false"
                },
                "countryId": 1,
                "dataCenterInfo": {
                    "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
                    "name": "MyOwn"
                },
                "leaseInfo": {
                    "renewalIntervalInSecs": 10,
                    "durationInSecs": 30,
                    "registrationTimestamp": 0,
                    "lastRenewalTimestamp": 0,
                    "evictionTimestamp": 0,
                    "serviceUpTimestamp": 0
                },
                "metadata": {
                    "management.port": str(self.port),
                    "zone": "default"
                },
                "homePageUrl": f"http://{self.host}:{self.port}/",
                "statusPageUrl": f"http://{self.host}:{self.port}/health",
                "healthCheckUrl": f"http://{self.host}:{self.port}/health",
                "secureHealthCheckUrl": "",
                "vipAddress": self.app_name.lower(),
                "secureVipAddress": self.app_name.lower(),
                "isCoordinatingDiscoveryServer": "false",
                "status": "UP",
                "overriddenstatus": "UNKNOWN",
                "lastUpdatedTimestamp": now_str,
                "lastDirtyTimestamp": now_str
            }
        }

    def register(self):
        url = f"{self.eureka_server}/eureka/apps/{self.app_name}"
        payload = self.get_instance_payload()
        try:
            logger.info(f"[EurekaClient] Registering [{self.app_name}] at {url}...")
            res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=5)
            if res.status_code in (200, 204):
                self.registered = True
                logger.info(f"[EurekaClient] Successfully registered [{self.app_name}] with Eureka.")
                self.start_heartbeat()
                return True
            else:
                logger.warning(f"[EurekaClient] Registration returned status {res.status_code}: {res.text}")
                return False
        except Exception as e:
            logger.error(f"[EurekaClient] Failed to register: {e}")
            return False

    def start_heartbeat(self):
        if self._heartbeat_thread and self._heartbeat_thread.is_alive():
            return

        self._stop_heartbeat.clear()
        self._heartbeat_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
        self._heartbeat_thread.start()

    def _heartbeat_loop(self):
        while not self._stop_heartbeat.is_set():
            time.sleep(10)
            if self._stop_heartbeat.is_set():
                break
            try:
                now_str = str(int(time.time() * 1000))
                url = f"{self.eureka_server}/eureka/apps/{self.app_name}/{self.instance_id}?status=UP&lastDirtyTimestamp={now_str}"
                res = requests.put(url, timeout=5)
                if res.status_code == 200:
                    self.last_heartbeat = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                elif res.status_code == 404:
                    logger.info("[EurekaClient] Instance not found in Eureka, re-registering...")
                    self.register()
            except Exception as e:
                logger.warning(f"[EurekaClient] Heartbeat error: {e}")

    def deregister(self):
        self._stop_heartbeat.set()
        if not self.registered:
            return
        try:
            url = f"{self.eureka_server}/eureka/apps/{self.app_name}/{self.instance_id}"
            logger.info(f"[EurekaClient] Deregistering [{self.app_name}]...")
            res = requests.delete(url, timeout=5)
            if res.status_code in (200, 204):
                logger.info(f"[EurekaClient] Successfully deregistered [{self.app_name}].")
            self.registered = False
        except Exception as e:
            logger.error(f"[EurekaClient] Deregistration error: {e}")
