import logging
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger("ai_service.db")

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None
    _memory_store: List[Dict[str, Any]] = []  # Fallback store if DB is offline

    @classmethod
    async def connect_db(cls):
        try:
            cls.client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
            # Verify server availability
            await cls.client.server_info()
            cls.db = cls.client[settings.DB_NAME]
            logger.info(f"Connected to MongoDB at {settings.MONGO_URI} (DB: {settings.DB_NAME})")
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}. Falling back to in-memory store for development.")
            cls.client = None
            cls.db = None

    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed.")

    @classmethod
    async def save_prediction(cls, prediction_dict: Dict[str, Any]) -> str:
        if cls.db is not None:
            try:
                result = await cls.db.predictions.insert_one(prediction_dict)
                return str(result.inserted_id)
            except Exception as e:
                logger.error(f"Error persisting to MongoDB: {e}")
        
        # Fallback to in-memory store
        cls._memory_store.append(prediction_dict)
        return prediction_dict.get("prediction_id", "mem_id")

    @classmethod
    async def get_predictions_by_member(cls, family_member_id: str) -> List[Dict[str, Any]]:
        if cls.db is not None:
            try:
                cursor = cls.db.predictions.find({"family_member_id": family_member_id})
                results = []
                async for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    results.append(doc)
                return results
            except Exception as e:
                logger.error(f"Error querying MongoDB: {e}")

        # Fallback query
        return [
            item for item in cls._memory_store
            if item.get("family_member_id") == family_member_id
        ]

    @classmethod
    async def get_prediction_by_id(cls, prediction_id: str) -> Optional[Dict[str, Any]]:
        if cls.db is not None:
            try:
                from bson.objectid import ObjectId
                doc = None
                if ObjectId.is_valid(prediction_id):
                    doc = await cls.db.predictions.find_one({"_id": ObjectId(prediction_id)})
                if not doc:
                    doc = await cls.db.predictions.find_one({"prediction_id": prediction_id})
                if doc:
                    doc["_id"] = str(doc["_id"])
                    return doc
            except Exception as e:
                logger.error(f"Error querying MongoDB by ID: {e}")

        # Fallback query
        for item in cls._memory_store:
            if item.get("prediction_id") == prediction_id or item.get("_id") == prediction_id:
                return item
        return None
