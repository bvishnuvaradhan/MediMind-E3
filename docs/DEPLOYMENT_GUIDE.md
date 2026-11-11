# MediMind Production Deployment Guide (All-Vercel + MongoDB Atlas)

MediMind runs end-to-end on Vercel across three dedicated Vercel Projects connected to the existing MongoDB Atlas cluster:

1. **Vercel Project 1 — Frontend (`frontend/`)**
   - Static Vite + React 19 SPA with client-side React Router fallback (`frontend/vercel.json`) and immutable `/assets/` cache headers.
   - Communicates with the Backend API Gateway via `VITE_API_BASE_URL` and optionally directly with the FastAPI AI Service via `VITE_AI_SERVICE_URL` (`frontend/src/config/apiConfig.js`).
   - Radiograph uploads exceeding **4 MB** use **Vercel Blob direct client upload** (`@vercel/blob/client` -> `/api/ai/fracture/blob-upload` -> direct client upload -> `{ family_member_id, blob_url, filename }` JSON to `/api/ai/fracture`) to stay safely beneath Vercel's 4.5 MB serverless request payload cap.

2. **Vercel Project 2 — Node.js Backend (`backend/`)**
   - Unified Vercel Functions deployment rooted at `backend/`, defined by `backend/vercel.json` and `backend/api/*.js`:
     - Public gateway handler: `backend/api/gateway.js` (`/`, `/health`, `/api/*`, plus `POST /api/ai/fracture/blob-upload` client token issuance).
     - Internal microservice handlers: `backend/api/{auth,family,hospital,doctor,appointment,records,knowledge}.js` mounted under `/_internal/<slug>/*`.
   - Routes all `/api/ai/*` requests and internal clinical pre-screening checks (`appointment-service`) to `AI_SERVICE_URL`.
   - Eureka and Kafka are disabled automatically when running on Vercel or in `NODE_ENV=production`.

3. **Vercel Project 3 — Python FastAPI AI Prediction Service (`ai-prediction-service/`)**
   - Vercel Python Function (`ai-prediction-service/api/index.py` + `ai-prediction-service/vercel.json`) powered by **Fluid compute + Vercel Large Functions (up to 5 GB uncompressed)** (`VERCEL_SUPPORT_LARGE_FUNCTIONS=1`, Pro/Enterprise plans).
   - Houses all 4 clinical prediction models cleanly:
     - `artifacts/diabetes/best_model.joblib` (`0.03 MB`)
     - `artifacts/fracture/best_model.pt` (`42.71 MB`)
     - `artifacts/heart_disease/random_forest.joblib` (`31.12 MB`)
     - Deterministic General Health NLP triage engine (`app/models/general_health/general_health_nlp.py`)
   - `ai-prediction-service/requirements.txt` specifies `--extra-index-url https://download.pytorch.org/whl/cpu` to pull CPU-only PyTorch wheels, and `ai-prediction-service/.vercelignore` + `vercel.json` `excludeFiles` strip datasets (`test-dataset/`), test suites (`tests/`), `scripts/`, `artifacts/experiments/`, `artifacts/fracture_v2/`, and unused checkpoints so the uncompressed runtime bundle is ~935 MB rather than >5 GB.
   - `Database.ensure_connected()` manages event-loop-safe async Motor connections across warm invocations, `_auth_mongo_client` reuses PyMongo connections, and all models are cached at class level for warm reuse.
   - `ai-prediction-service/Dockerfile` remains preserved for optional local/self-hosted Docker execution.

4. **Database — MongoDB Atlas**
   - Shared Atlas cluster hosting `medimind_auth`, `medimind_family`, `medimind_hospital`, `medimind_doctor`, `medimind_appointment`, `medimind_records`, `medimind_knowledge`, and `medimind_ai`.

---

## Step-by-Step Deployment on Vercel

### 1. Prepare MongoDB Atlas Network & Vercel Blob Storage
1. In MongoDB Atlas **Network Access**, allow Vercel serverless egress (`0.0.0.0/0` paired with TLS and strong database credentials). Note: Vercel Large Functions are incompatible with Static IPs / Secure Compute.
2. In your Vercel Team/Project Dashboard, open **Storage -> Create Database -> Blob** (`medimind-radiographs`) to obtain `BLOB_READ_WRITE_TOKEN` (connect the store to **Project 2 (`backend/`)**, and also to **Project 3 (`ai-prediction-service/`)** if using a Private Blob store).

### 2. Deploy Project 3 — AI Prediction Service (`ai-prediction-service/`)
Deploy `ai-prediction-service` first so its production HTTPS URL is available for `AI_SERVICE_URL` and `VITE_AI_SERVICE_URL`.

1. Create a Vercel Project imported from GitHub `main`.
2. Set **Root Directory** to `ai-prediction-service`.
3. Under **Settings -> Functions**:
   - Enable **Fluid compute** and configure Function CPU / Memory (recommended at least **1.7 vCPU / 3,008 MB RAM** or **2 vCPU / 4 GB RAM** for PyTorch + RandomForest inference).
   - **Important:** Do NOT configure memory inside `vercel.json`; configure it in Vercel Dashboard **Settings -> Functions -> Function CPU**.
4. Under **Settings -> Environment Variables**, configure:
   - `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` (**Required** to unlock the 5 GB bundle ceiling on Pro/Enterprise)
   - `APP_ENV=production`
   - `STRICT_REMOTE_DB=true`
   - `DISABLE_EUREKA=true`
   - `MONGO_URI=<Atlas mongodb+srv URI>`
   - `DB_NAME=medimind_ai`
   - `JWT_SECRET=<shared with backend>`
   - `JWT_ALGORITHM=HS256`
   - `INTERNAL_SERVICE_KEY=<shared with backend>`
   - `CORS_ORIGIN=https://<frontend-domain>.vercel.app,https://<backend-domain>.vercel.app`
   - Optional: `BLOB_READ_WRITE_TOKEN` (required only for Private Blob stores), `GROQ_ENABLED` / `GROQ_API_KEY`
5. Deploy and verify `curl https://<your-ai-domain>.vercel.app/health` returns `"status": "healthy"` and `"eureka_enabled": false`.

### 3. Deploy Project 2 — Node.js Backend (`backend/`)
1. Create a second Vercel Project imported from GitHub `main` with **Root Directory** set to `backend`.
2. Configure encrypted environment variables from [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md), including:
   - `NODE_ENV=production`
   - `STRICT_REMOTE_DB=true`
   - `MONGODB_URI`, `JWT_SECRET`, `INTERNAL_SERVICE_SECRET`, `INTERNAL_SERVICE_KEY`
   - `AI_SERVICE_URL=https://<your-ai-domain>.vercel.app` (no trailing slash)
   - `BLOB_READ_WRITE_TOKEN=<Vercel Blob store read-write token>`
   - `CORS_ORIGIN=https://<your-frontend-domain>.vercel.app`
3. Deploy and verify `https://<your-backend-domain>.vercel.app/health`.

### 4. Deploy Project 1 — React Frontend (`frontend/`)
1. Create a third Vercel Project imported from GitHub `main` with **Root Directory** set to `frontend` and Framework Preset **Vite**.
2. Set environment variables:
   - `VITE_API_BASE_URL=https://<your-backend-domain>.vercel.app` (no trailing slash)
   - `VITE_AI_SERVICE_URL=https://<your-ai-domain>.vercel.app` (or leave unset to route via `VITE_API_BASE_URL`)
   - `VITE_BLOB_ACCESS=public` (or `private` if your Blob store was created as Private)
3. Deploy and verify login, nested SPA navigation, and all 4 AI screening modules.

---

## Local Development Workflow

```bash
# 1. Start local backend gateway + all 8 Express microservices (ports 5000-5006, 5008)
npm --prefix backend run dev

# 2. Start FastAPI AI prediction service (port 5007)
cd ai-prediction-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 5007

# 3. Start Vite dev server (port 5173, proxies /api -> localhost:5000)
npm --prefix frontend run dev
```
