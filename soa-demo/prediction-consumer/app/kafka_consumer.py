"""
Kafka Consumer Service for MediMind AI Prediction Demonstration.
Subscribes to 'medimind.predictions', validates event structure, and logs asynchronously.
"""

import json
import logging
import threading
import time
from typing import Dict, Any, Optional
from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable

logger = logging.getLogger("ai_prediction_consumer")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class PredictionConsumerService:
    def __init__(self, bootstrap_servers="127.0.0.1:9092", topic="medimind.predictions", group_id="medimind-ai-prediction-group"):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.group_id = group_id
        self.consumer: Optional[KafkaConsumer] = None
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.processed_events_count = 0
        self.last_event: Optional[Dict[str, Any]] = None
        self.seen_event_ids = set()

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run_loop, daemon=True)
        self.thread.start()
        logger.info(f"[PredictionConsumer] Background consumer thread started for topic '{self.topic}'.")

    def _run_loop(self):
        while self.running:
            try:
                logger.info(f"[PredictionConsumer] Connecting to Kafka broker at {self.bootstrap_servers}...")
                self.consumer = KafkaConsumer(
                    self.topic,
                    bootstrap_servers=self.bootstrap_servers.split(","),
                    group_id=self.group_id,
                    auto_offset_reset="earliest",
                    enable_auto_commit=True,
                    auto_commit_interval_ms=1000,
                    value_deserializer=lambda m: json.loads(m.decode("utf-8"))
                )
                logger.info(f"[PredictionConsumer] Connected successfully. Subscribed to topic: {self.topic}")
                break
            except NoBrokersAvailable:
                logger.warning(f"[PredictionConsumer] Kafka broker not ready yet. Retrying in 3 seconds...")
                time.sleep(3)
            except Exception as e:
                logger.error(f"[PredictionConsumer] Unexpected error connecting: {e}. Retrying in 3 seconds...")
                time.sleep(3)

        while self.running and self.consumer:
            try:
                records = self.consumer.poll(timeout_ms=1000)
                if records:
                    for tp, msgs in records.items():
                        for message in msgs:
                            if not self.running:
                                break
                            self._process_message(message.value)
            except Exception as e:
                if self.running:
                    logger.error(f"[PredictionConsumer] Error during consumption poll: {e}")
                    time.sleep(1)

    def _process_message(self, event: Dict[str, Any]):
        """
        Validates event structure and logs asynchronous demonstration processing.
        Does not execute fake medical predictions or invent clinical results.
        """
        event_id = event.get("eventId")
        event_type = event.get("eventType")
        patient_id = event.get("patientId")
        prediction_type = event.get("predictionType")
        source = event.get("source")
        timestamp = event.get("timestamp")

        # Duplicate protection
        if event_id and event_id in self.seen_event_ids:
            logger.info(f"[PredictionConsumer] Ignoring duplicate eventId: {event_id}")
            return

        # Structure validation
        required_fields = ["eventId", "eventType", "patientId", "predictionType", "timestamp", "source"]
        missing = [f for f in required_fields if not event.get(f)]
        if missing:
            logger.warning(f"[PredictionConsumer] Invalid event schema! Missing fields: {missing}. Payload: {event}")
            return

        if event_id:
            self.seen_event_ids.add(event_id)
            if len(self.seen_event_ids) > 10000:
                self.seen_event_ids.clear()

        # Demonstration asynchronous processing
        self.processed_events_count += 1
        self.last_event = {
            "eventId": event_id,
            "eventType": event_type,
            "patientId": patient_id,
            "predictionType": prediction_type,
            "timestamp": timestamp,
            "source": source,
            "processedAt": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            "status": "PROCESSED_DEMO"
        }

        # Clear logging distinguishing demo events from actual clinical inference
        logger.info("=" * 70)
        logger.info("[DEMO-SOA-AI-CONSUMER] Asynchronous Prediction Event Received:")
        logger.info(f"   -> Event ID:        {event_id}")
        logger.info(f"   -> Event Type:      {event_type}")
        logger.info(f"   -> Patient ID:      {patient_id}")
        logger.info(f"   -> Prediction Type: {prediction_type}")
        logger.info(f"   -> Source:          {source}")
        logger.info(f"   -> Timestamp:       {timestamp}")
        logger.info("[DEMO-SOA-AI-CONSUMER] Event validation passed. Asynchronous processing simulated successfully.")
        logger.info("[DEMO-SOA-AI-CONSUMER] NOTE: Clinical safety policy active: Demonstration event acknowledged without fake diagnostics.")
        logger.info("=" * 70)

    def stop(self):
        self.running = False
        if self.consumer:
            try:
                self.consumer.close()
                logger.info("[PredictionConsumer] Kafka consumer closed.")
            except Exception as e:
                logger.error(f"[PredictionConsumer] Error closing consumer: {e}")
