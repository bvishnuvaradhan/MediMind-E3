from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from starlette.types import ASGIApp, Receive, Scope, Send
from app.core.config import settings
from app.core.database import Database
from app.core.eureka import EurekaClient, is_eureka_enabled
from app.api.v1.general_health import router as general_health_router
from app.api.v1.heart_disease import router as heart_disease_router
from app.api.v1.diabetes import router as diabetes_router
from app.api.v1.fracture import router as fracture_router
from app.api.v1.analytics import router as analytics_router


def normalize_ai_path(path: str) -> str:
    """Map public /ai/* Vercel Service paths onto FastAPI's /health and /api/ai/* routes."""
    if path in {"/ai", "/ai/", "/ai/health"}:
        return "/health"
    if path in {"/ai/docs", "/ai/redoc", "/ai/openapi.json"}:
        return path[3:]
    if path.startswith("/ai/api/"):
        return path[3:]
    if path.startswith("/ai/"):
        return f"/api{path}"
    return path


class AiPrefixNormalizationMiddleware:
    """ASGI middleware that normalizes incoming /ai/* paths before FastAPI routing."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            original_path = scope.get("path", "")
            normalized_path = normalize_ai_path(original_path)
            if normalized_path != original_path:
                scope = dict(scope)
                scope["path"] = normalized_path
                scope["raw_path"] = normalized_path.encode("latin-1")
        await self.app(scope, receive, send)


eureka_client = EurekaClient(app_name="AI-PREDICTION-SERVICE", port=settings.PORT)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to Database and register with Eureka when enabled
    await Database.connect_db()
    if is_eureka_enabled():
        eureka_client.start()
    yield
    # Shutdown: Close Eureka registration and Database connection
    if is_eureka_enabled():
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
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Internal-Service-Key", "x-request-id", "x-correlation-id"],
)

# Normalize external /ai/* paths outermost while keeping /health and /api/ai/* intact for internal bindings
app.add_middleware(AiPrefixNormalizationMiddleware)

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
        "eureka_enabled": is_eureka_enabled(),
        "eureka_registered": eureka_client.registered
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
