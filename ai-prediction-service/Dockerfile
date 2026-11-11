# MediMind AI Prediction Service (Container Deployment: Render / Railway / Cloud Run)
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_ENV=production \
    DISABLE_EUREKA=true \
    PORT=5007

WORKDIR /app

# Install minimal system dependencies for Pillow / scientific wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU-only wheels first to keep image lightweight (~800 MB instead of 4+ GB CUDA)
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --extra-index-url https://download.pytorch.org/whl/cpu \
        "torch>=2.2.0" "torchvision>=0.17.0" && \
    pip install -r requirements.txt

# Copy only runtime source and active model artifacts (.dockerignore excludes experiments/datasets)
COPY app ./app
COPY artifacts ./artifacts

# Create non-root runtime user
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 5007

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import os, urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.getenv(\"PORT\", \"5007\")}/health', timeout=5)" || exit 1

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-5007} --workers 1"]
