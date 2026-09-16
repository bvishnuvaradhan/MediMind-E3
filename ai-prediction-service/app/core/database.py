import logging
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger("ai_service.db")

# Required fields that every prediction record must contain before persisting
_REQUIRED_FIELDS = {"prediction_id", "family_member_id", "risk_level", "prediction_type", "created_at"}


class Database:
    """
    Async MongoDB client with resilient in-memory fallback.
    Provides save, query-by-member (paginated, sorted), and query-by-id operations.
    """

    client: Optional[AsyncIOMotorClient] = None
    db = None
    _memory_store: List[Dict[str, Any]] = []   # Used when MongoDB is unavailable

    # ─────────────────────────────────────────────────────────────────────────
    # LIFECYCLE
    # ─────────────────────────────────────────────────────────────────────────

    @classmethod
    async def connect_db(cls) -> None:
        """
        Connect to MongoDB and create performance / uniqueness indexes.
        Falls back to the in-memory store if MongoDB is unreachable.
        """
        try:
            cls.client = AsyncIOMotorClient(
                settings.MONGO_URI,
                serverSelectionTimeoutMS=2000
            )
            # Verify server availability
            await cls.client.server_info()
            cls.db = cls.client[settings.DB_NAME]
            logger.info("Connected to MongoDB database '%s'", settings.DB_NAME)
            # Ensure indexes exist — idempotent, safe to call every startup
            await cls.create_indexes()
        except Exception as e:
            logger.warning(
                f"MongoDB connection failed: {e}. "
                "Falling back to in-memory store for development/testing."
            )
            cls.client = None
            cls.db = None

    @classmethod
    async def close_db(cls) -> None:
        """Gracefully close the MongoDB connection."""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed.")

    # ─────────────────────────────────────────────────────────────────────────
    # INDEX MANAGEMENT
    # ─────────────────────────────────────────────────────────────────────────

    @classmethod
    async def create_indexes(cls) -> None:
        """
        Create MongoDB indexes on the predictions collection:
        - Unique index on prediction_id  (fast single-record lookups, prevents duplicates)
        - Compound index on {family_member_id, created_at DESC}  (fast member history queries)
        """
        if cls.db is None:
            return
        try:
            collection = cls.db.predictions
            # Unique index — prevents duplicate prediction records
            await collection.create_index("prediction_id", unique=True, name="idx_prediction_id_unique")
            # Compound index — covers member history queries sorted by recency
            await collection.create_index(
                [("family_member_id", 1), ("created_at", -1)],
                name="idx_member_id_created_at"
            )
            logger.info("MongoDB indexes verified / created on predictions collection.")
        except Exception as e:
            logger.warning(f"Index creation warning: {e}")

    # ─────────────────────────────────────────────────────────────────────────
    # WRITE OPERATIONS
    # ─────────────────────────────────────────────────────────────────────────

    @classmethod
    async def save_prediction(cls, prediction_dict: Dict[str, Any]) -> str:
        """
        Persist a prediction record to MongoDB (or the in-memory fallback).

        Raises:
            ValueError: If the record is missing required fields.
        Returns:
            The inserted document ID (MongoDB ObjectId string or prediction_id).
        """
        # ── Integrity guard ──────────────────────────────────────────────────
        missing = _REQUIRED_FIELDS - set(prediction_dict.keys())
        if missing:
            raise ValueError(
                f"Prediction record is missing required fields: {missing}"
            )

        # ── MongoDB path ─────────────────────────────────────────────────────
        if cls.db is not None:
            try:
                result = await cls.db.predictions.insert_one(prediction_dict)
                return str(result.inserted_id)
            except Exception as e:
                logger.error(f"Error persisting to MongoDB: {e}")
                # Duplicate prediction_id should surface immediately so callers can
                # decide whether to retry, reject, or alert. The in-memory fallback
                # is only for a missing/failed Mongo connection, not for duplicate-key
                # violations on an active database.
                if "duplicate key" in str(e).lower() or "e11000" in str(e).lower():
                    raise

        # ── In-memory fallback ───────────────────────────────────────────────
        cls._memory_store.append(prediction_dict)
        return prediction_dict.get("prediction_id", "mem_id")

    # ─────────────────────────────────────────────────────────────────────────
    # READ OPERATIONS
    # ─────────────────────────────────────────────────────────────────────────

    @classmethod
    async def get_predictions_by_member(
        cls,
        family_member_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Return prediction history for a family member.
        Results are sorted by created_at descending (most recent first)
        and support pagination via skip / limit.
        """
        if cls.db is not None:
            try:
                cursor = (
                    cls.db.predictions
                    .find({"family_member_id": family_member_id})
                    .sort("created_at", -1)
                    .skip(skip)
                    .limit(limit)
                )
                results = []
                async for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    results.append(doc)
                return results
            except Exception as e:
                logger.error(f"Error querying MongoDB: {e}")

        # ── In-memory fallback (sorted by created_at DESC) ──────────────────
        member_records = [
            item for item in cls._memory_store
            if item.get("family_member_id") == family_member_id
        ]
        member_records.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return member_records[skip: skip + limit]

    @classmethod
    async def get_prediction_by_id(cls, prediction_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a single prediction record by its prediction_id string
        or MongoDB ObjectId.
        """
        if cls.db is not None:
            try:
                from bson import ObjectId
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

        # ── In-memory fallback ───────────────────────────────────────────────
        for item in cls._memory_store:
            if (
                item.get("prediction_id") == prediction_id
                or item.get("_id") == prediction_id
            ):
                return item
        return None
