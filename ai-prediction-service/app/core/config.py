import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "MediMind AI Prediction Service"
    VERSION: str = "1.0.0"
    PORT: int = int(os.getenv("PORT", 5007))
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "medimind_ai")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "medimind_super_secret_jwt_key_2026")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    INTERNAL_SERVICE_KEY: str = os.getenv("INTERNAL_SERVICE_KEY", "medimind_internal_microservice_secret_key")

settings = Settings()
