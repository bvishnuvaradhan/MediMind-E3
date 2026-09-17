import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    def __init__(self) -> None:
        self.PROJECT_NAME = "MediMind AI Prediction Service"
        self.VERSION = "1.0.0"
        self.PORT = int(os.getenv("PORT", 5007))
        self.MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self.DB_NAME = os.getenv("DB_NAME", "medimind_ai")
        self.JWT_SECRET = self._required_secret("JWT_SECRET")
        self.JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
        self.INTERNAL_SERVICE_KEY = self._required_secret("INTERNAL_SERVICE_KEY")

    @staticmethod
    def _required_secret(name: str) -> str:
        value = os.getenv(name, "").strip()
        if not value:
            raise RuntimeError(
                f"{name} must be configured through the environment or .env file."
            )
        return value

settings = Settings()
