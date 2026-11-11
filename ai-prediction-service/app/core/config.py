import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load service-level .env first, then fallback to cwd .env (skip during pytest or Vercel runtime)
if not os.getenv("PYTEST_CURRENT_TEST") and not os.getenv("VERCEL"):
    _service_env = Path(__file__).resolve().parent.parent.parent / ".env"
    if _service_env.exists():
        load_dotenv(dotenv_path=_service_env)
    else:
        load_dotenv()


def _env_flag(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _is_localhost_uri(uri: str) -> bool:
    lowered = (uri or "").lower()
    return "localhost" in lowered or "127.0.0.1" in lowered


class Settings:
    def __init__(self) -> None:
        self.PROJECT_NAME = "MediMind AI Prediction Service"
        self.VERSION = "1.0.0"
        self.PORT = int(os.getenv("PORT", 5007))

        env_mode = (
            os.getenv("APP_ENV")
            or os.getenv("ENVIRONMENT")
            or os.getenv("NODE_ENV")
            or "development"
        ).strip().lower()
        self.IS_VERCEL = bool(os.getenv("VERCEL"))
        self.IS_PRODUCTION = env_mode == "production" or os.getenv("VERCEL_ENV") == "production"
        self.STRICT_REMOTE_DB = (
            self.IS_PRODUCTION
            or (self.IS_VERCEL and env_mode != "test")
            or _env_flag("STRICT_REMOTE_DB", False)
        )
        self.ALLOW_MEMORY_DB_FALLBACK = (
            not self.STRICT_REMOTE_DB and _env_flag("ALLOW_MEMORY_DB_FALLBACK", True)
        )

        configured_mongo = (os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or "").strip()
        if not configured_mongo:
            if self.STRICT_REMOTE_DB:
                raise RuntimeError("MONGO_URI (or MONGODB_URI) must be configured in production.")
            configured_mongo = "mongodb://localhost:27017"
        if self.STRICT_REMOTE_DB and _is_localhost_uri(configured_mongo):
            raise RuntimeError(
                "Localhost MongoDB URI is strictly prohibited when STRICT_REMOTE_DB or production mode is enabled."
            )

        self.MONGO_URI = configured_mongo
        self.DB_NAME = os.getenv("DB_NAME", "medimind_ai")
        self.JWT_SECRET = self._required_secret("JWT_SECRET")
        self.JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        self.INTERNAL_SERVICE_KEY = self._required_secret("INTERNAL_SERVICE_KEY")
        self.CORS_ORIGINS = self._parse_cors_origins()
        self.BLOB_READ_WRITE_TOKEN = os.getenv("BLOB_READ_WRITE_TOKEN", "").strip()
        self.ALLOWED_BLOB_HOSTS = [
            h.strip().lower()
            for h in os.getenv("ALLOWED_BLOB_HOSTS", ".blob.vercel-storage.com").split(",")
            if h.strip()
        ]

    def _parse_cors_origins(self) -> List[str]:
        raw = os.getenv("CORS_ORIGIN", "").strip()
        if raw:
            origins = [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
            if self.IS_PRODUCTION:
                origins = [o for o in origins if o != "*"]
            if origins:
                return origins
        if self.IS_PRODUCTION:
            return []
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5000",
            "http://localhost:5000",
        ]

    @staticmethod
    def _required_secret(name: str) -> str:
        value = os.getenv(name, "").strip()
        if not value:
            raise RuntimeError(
                f"{name} must be configured through the environment or .env file."
            )
        return value


settings = Settings()
