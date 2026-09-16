import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "MediMind AI Prediction Service"
    VERSION: str = "1.0.0"
    PORT: int = int(os.getenv("PORT", 5007))
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    DB_NAME: str = os.getenv("DB_NAME", "medimind_ai")

settings = Settings()
