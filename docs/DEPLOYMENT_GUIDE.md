# MediMind Production Deployment Guide

MediMind uses a split multi-project deployment architecture that preserves all 8 Node.js domain microservices, the API Gateway, the React SPA frontend, MongoDB Atlas, and all 4 AI clinical prediction models without exceeding Vercel serverless bundle or execution limits.

## Target Architecture

1. **Vercel Project 1 — Frontend (`frontend/`)**
   - Static Vite + React 19 SPA with client-side React Router fallback (`frontend/vercel.json`) and immutable `/assets/` cache headers.
   - Calls the deployed Backend API Gateway via `VITE_API_BASE_URL` (using `frontend/src/config/apiConfig.js`).
   - Optionally routes large (>4.5 MB) X-ray radiograph multipart uploads directly to the hosted Python AI service via `VITE_AI_SERVICE_URL` (`buildAiUrl` in `frontend/src/config/apiConfig.js`).

2. **Vercel Project 2 — Node.js Backend (`backend/`)**
   - Unified Vercel Functions deployment rooted at `backend/`, defined by `backend/vercel.json` and `backend/api/*.js`:
     - Public gateway handler: `backend/api/gateway.js` (`/`, `/health`, `/api/*`).
     - Internal microservice handlers: `backend/api/{auth,family,hospital,doctor,appointment,records,knowledge}.js` mounted under `/_internal/<slug>/*`.
   - Every Node.js service also retains its standalone `api/index.js`, `vercel.json`, `server.js`, and self-contained `package.json` dependencies so each service can alternatively be deployed standalone if desired.
   - Eureka and Kafka are disabled automatically when running on Vercel or in `NODE_ENV=production` unless explicitly enabled.

3. **External Python Container — AI Prediction Service (`ai-prediction-service/`)**
   - FastAPI + Uvicorn container built from `ai-prediction-service/Dockerfile` (Python 3.11 slim + CPU-only PyTorch + `scikit-learn==1.7.0`).
   - Houses all 4 clinical prediction models cleanly inside one long-running container (Render, Railway, Google Cloud Run, etc.) using `ai-prediction-service/render.yaml` or `ai-prediction-service/Dockerfile`, avoiding Vercel's 250 MB / 500 MB Python bundle caps and cold-start overhead for PyTorch/ResNet-18.
   - `.dockerignore` excludes local datasets, tests, and research experiment folders while retaining active production artifacts:
     - `artifacts/diabetes/best_model.joblib`
     - `artifacts/fracture/best_model.pt`
     - `artifacts/heart_disease/random_forest.joblib`
     - Deterministic NLP triage engine (`app/models/general_health/general_health_nlp.py`)

4. **Database — MongoDB Atlas**
   - Logical databases on the existing Atlas cluster (`medimind_auth`, `medimind_family`, `medimind_hospital`, `medimind_doctor`, `medimind_appointment`, `medimind_records`, `medimind_knowledge`, `medimind_ai`).
   - All Node.js services use cached singleton Mongoose connection pooling (`src/config/db.js`) plus lazy non-`/health` middleware so serverless warm invocations reuse connections without leaking sockets.

---

## Step-by-Step Deployment

### 1. Prepare MongoDB Atlas Network & Credentials
1. In MongoDB Atlas **Network Access**, allow access from your Vercel Functions and container host (or `0.0.0.0/0` if using dynamic serverless egress IPs, paired with strong database credentials and TLS).
2. Confirm the Atlas database user has `readWrite` permissions across all 8 `medimind_*` logical databases.
3. Obtain the `mongodb+srv://...` connection string (do **not** commit real URIs to Git).

### 2. Deploy the AI Prediction Service (Container Host: Render / Railway / Cloud Run)
Deploy `ai-prediction-service/` first so its public HTTPS URL is ready for the Backend Gateway and Frontend.

- **Option A: Render (Blueprint via `ai-prediction-service/render.yaml`)**
  1. Connect the GitHub repository in Render and point Root Directory to `ai-prediction-service` (Dockerfile runtime).
  2. Configure secret environment variables in Render Dashboard (`MONGO_URI`, `JWT_SECRET`, `INTERNAL_SERVICE_KEY`, `CORS_ORIGIN`, optional `GROQ_API_KEY`).
  3. Set health check path to `/health`.
- **Option B: Cloud Run / Railway / Docker**
  ```bash
  docker build -t medimind-ai ./ai-prediction-service
  ```
  Run with port `5007` (or `$PORT`) and set the required environment variables listed in [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).
- **Verify:**
  ```bash
  curl https://<your-ai-service-host>/health
  ```
  Confirm `"status": "healthy"` and `"eureka_enabled": false`.

### 3. Deploy the Node.js Backend on Vercel (Project 2)
1. Create a new Vercel Project imported from GitHub `main`.
2. Set **Root Directory** to `backend`.
3. Install dependencies across workspace or root (`npm install` runs automatically at `backend/`).
4. Add all required encrypted environment variables from [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md), including:
   - `NODE_ENV=production`
   - `STRICT_REMOTE_DB=true`
   - `MONGODB_URI`, `JWT_SECRET`, `INTERNAL_SERVICE_SECRET`, `INTERNAL_SERVICE_KEY`
   - `AI_SERVICE_URL=https://<your-ai-service-host>` (no trailing slash)
   - `CORS_ORIGIN=https://<your-frontend-domain>.vercel.app`
5. Deploy and verify `https://<your-backend-domain>.vercel.app/health`.

> **Important Note on Vercel Deployment Protection:** If Vercel Authentication/SSO Protection is enabled on Preview deployments, server-to-server internal calls (`/_internal/<slug>`) between `gateway` and domain functions will be blocked by Vercel SSO. Keep Vercel Authentication disabled for production API deployments or use custom domains / separate service URLs (`AUTH_SERVICE_URL`, etc.).

### 4. Deploy the React Frontend on Vercel (Project 1)
1. Create a second Vercel Project imported from GitHub `main`.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite** (`npm run build`, output directory `dist`).
4. Set environment variables:
   - `VITE_API_BASE_URL=https://<your-backend-domain>.vercel.app` (no trailing slash)
   - Optional `VITE_AI_SERVICE_URL=https://<your-ai-service-host>` (bypasses Vercel's 4.5 MB serverless body cap for large X-ray radiograph uploads if desired; make sure `CORS_ORIGIN` on the AI service includes your Frontend Vercel URL).
5. Deploy and verify client-side routing (refreshing nested routes like `/family/dashboard`) and login flow.

---

## Local Development Workflow

Local development remains fully intact alongside serverless support:

```bash
# 1. Start local backend gateway + all 8 Express microservices (ports 5000-5006, 5008)
npm --prefix backend run dev

# 2. Start FastAPI AI prediction service (port 5007)
cd ai-prediction-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 5007

# 3. Start Vite dev server (port 5173, proxies /api -> localhost:5000)
npm --prefix frontend run dev
```

For local multi-service development, Eureka (`EUREKA_ENABLED=true`) and Kafka (`KAFKA_ENABLED=true`) remain opt-in and only run outside production/test/Vercel environments when explicitly enabled.
