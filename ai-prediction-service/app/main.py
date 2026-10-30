from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import Database
from app.core.eureka import EurekaClient
from app.api.v1.general_health import router as general_health_router
from app.api.v1.heart_disease import router as heart_disease_router
from app.api.v1.diabetes import router as diabetes_router
from app.api.v1.fracture import router as fracture_router
from app.api.v1.analytics import router as analytics_router

eureka_client = EurekaClient(app_name="AI-PREDICTION-SERVICE", port=settings.PORT)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Database and register with Eureka
    await Database.connect_db()
    eureka_client.start()
    yield
    # Shutdown: Close Eureka registration and Database connection
    eureka_client.stop()
    await Database.close_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="MediMind AI Prediction Microservice hosting clinical decision-support models.",
    lifespan=lifespan
)

# Enable CORS for API Gateway & Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 Routers (specific static routes before parameterized routes)
app.include_router(analytics_router)
app.include_router(general_health_router)
app.include_router(heart_disease_router)
app.include_router(diabetes_router)
app.include_router(fracture_router)

@app.get("/health", tags=["Health Check"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_connected": Database.db is not None,
        "eureka_registered": eureka_client.registered
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
