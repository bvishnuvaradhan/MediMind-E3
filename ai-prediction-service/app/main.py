from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import Database
from app.api.v1.general_health import router as general_health_router
from app.api.v1.heart_disease import router as heart_disease_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Database
    await Database.connect_db()
    yield
    # Shutdown: Close Database connection
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

# Include API v1 Routers
app.include_router(general_health_router)
app.include_router(heart_disease_router)

@app.get("/health", tags=["Health Check"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_connected": Database.db is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
