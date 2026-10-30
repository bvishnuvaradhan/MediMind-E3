"""
MediMind AI Prediction Consumer Service Entrypoint.
FastAPI application with Eureka registration and Kafka consumer loop.
"""

import os
import sys
from pathlib import Path

# Ensure prediction-consumer root directory is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.eureka_client import EurekaClientAdapter
from app.kafka_consumer import PredictionConsumerService

logger = logging.getLogger("main")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# Environment configuration
PORT = int(os.getenv("PREDICTION_CONSUMER_PORT", "8001"))
HOST = os.getenv("PREDICTION_CONSUMER_HOST", "127.0.0.1")
EUREKA_SERVER = os.getenv("EUREKA_SERVER_URL", "http://127.0.0.1:8761")
KAFKA_BROKERS = os.getenv("KAFKA_BROKERS", "127.0.0.1:9092")
TOPIC = os.getenv("KAFKA_TOPIC", "medimind.predictions")
GROUP_ID = os.getenv("KAFKA_GROUP_ID", "medimind-ai-prediction-group")

# Service components
eureka_adapter = EurekaClientAdapter(
    eureka_server=EUREKA_SERVER,
    app_name="MEDIMIND-AI-CONSUMER",
    port=PORT,
    host=HOST
)

consumer_service = PredictionConsumerService(
    bootstrap_servers=KAFKA_BROKERS,
    topic=TOPIC,
    group_id=GROUP_ID
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[Main] Starting MediMind AI Prediction Consumer...")
    # 1. Start Kafka consumer thread
    consumer_service.start()
    # 2. Register with Eureka
    eureka_adapter.register()
    yield
    logger.info("[Main] Shutting down MediMind AI Prediction Consumer...")
    eureka_adapter.deregister()
    consumer_service.stop()

app = FastAPI(
    title="MediMind AI Prediction Consumer",
    description="SOA Demonstration Kafka Consumer for AI Prediction Events",
    lifespan=lifespan
)

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "MEDIMIND-AI-CONSUMER",
        "role": "Kafka AI Prediction Event Consumer",
        "port": PORT,
        "topic": TOPIC,
        "groupId": GROUP_ID,
        "eureka": {
            "registered": eureka_adapter.registered,
            "instanceId": eureka_adapter.instance_id,
            "eurekaServer": EUREKA_SERVER,
            "lastHeartbeat": eureka_adapter.last_heartbeat
        },
        "metrics": {
            "processedEvents": consumer_service.processed_events_count,
            "lastEvent": consumer_service.last_event
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=HOST, port=PORT, log_level="info")
