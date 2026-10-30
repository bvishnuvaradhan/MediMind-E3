"""
Resilient Netflix Eureka Registration Client for MediMind FastAPI AI Prediction Service.
"""

import os
import time
import threading
import logging
import requests

logger = logging.getLogger("eureka")
logging.basicConfig(level=logging.INFO)

EUREKA_SERVER_URL = os.getenv("EUREKA_SERVER_URL", "http://127.0.0.1:8761").rstrip("/")
EUREKA_URL = f"{EUREKA_SERVER_URL}/eureka"

class EurekaClient:
    def __init__(self, app_name="AI-PREDICTION-SERVICE", port=5007, host="127.0.0.1"):
        self.app_name = app_name.upper()
        self.port = int(port)
        self.host = host
        self.instance_id = f"{self.host}:{self.app_name.lower()}:{self.port}"
        self.registered = False
        self._stop_event = threading.Event()
        self._thread = None

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

    def start(self):
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run_lifecycle, daemon=True)
        self._thread.start()

    def _run_lifecycle(self):
        # Register loop
        while not self._stop_event.is_set():
            if not self.registered:
                success = self._register()
                if not success:
                    time.sleep(10)
                    continue

            # Heartbeat loop
            while not self._stop_event.is_set() and self.registered:
                time.sleep(4)
                if self._stop_event.is_set():
                    break
                try:
                    now_str = str(int(time.time() * 1000))
                    url = f"{EUREKA_URL}/apps/{self.app_name}/{self.instance_id}?status=UP&lastDirtyTimestamp={now_str}"
                    res = requests.put(url, timeout=4)
                    if res.status_code == 404:
                        logger.info(f"[EurekaClient:{self.app_name}] Lease expired, re-registering...")
                        self.registered = False
                        break
                except Exception as e:
                    logger.warning(f"[EurekaClient:{self.app_name}] Heartbeat failed: {e}")

    def _register(self):
        url = f"{EUREKA_URL}/apps/{self.app_name}"
        payload = self.get_instance_payload()
        try:
            res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=5)
            if res.status_code in (200, 204):
                self.registered = True
                logger.info(f"[EurekaClient:{self.app_name}] Successfully registered with Eureka at {EUREKA_SERVER_URL}")
                return True
            else:
                logger.warning(f"[EurekaClient:{self.app_name}] Registration status {res.status_code}: {res.text}")
                return False
        except Exception as e:
            logger.warning(f"[EurekaClient:{self.app_name}] Eureka server unreachable ({e}). Retrying in 10s...")
            return False

    def stop(self):
        self._stop_event.set()
        if not self.registered:
            return
        try:
            url = f"{EUREKA_URL}/apps/{self.app_name}/{self.instance_id}"
            requests.delete(url, timeout=3)
            self.registered = False
            logger.info(f"[EurekaClient:{self.app_name}] Deregistered from Eureka.")
        except Exception as e:
            logger.warning(f"[EurekaClient:{self.app_name}] Deregistration error: {e}")
