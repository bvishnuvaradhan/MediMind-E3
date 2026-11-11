# MediMind Production Deployment Guide (Single Vercel Project + MongoDB Atlas)

MediMind deploys through **ONE Vercel Project (`medimind`, domain `medimind.vercel.app`)** rooted at the repository root (`.`) using **Vercel Services** ([`vercel.json`](../vercel.json)) connected to the existing MongoDB Atlas cluster:

## Architecture in One Vercel Project

| Surface / Service | Root Directory | Exposure | Purpose |
| :--- | :--- | :--- | :--- |
| **`frontend`** (primary) | `frontend/` | Public `/` (`/(.*)`) | Vite + React 19 SPA with React Router `/index.html` fallback and immutable `/assets/` cache headers. |
| **`backend`** | `backend/api-gateway/` | Public `/api` & `/api/*` | Express API Gateway enforcing JWT, RBAC, CORS, rate limits, private Vercel Blob token exchange (`POST /api/ai/fracture/blob-upload`), and Service Binding proxy dispatch. |
| **`auth`**, **`family`**, **`hospital`**, **`doctor`**, **`appointment`**, **`records`**, **`knowledge`** | `backend/<service>/` | **Private** (Service Bindings only) | All 7 domain Express microservices remain independently built services and communicate over internal Vercel Service Bindings (`AUTH_SERVICE_URL`, `FAMILY_SERVICE_URL`, `HOSPITAL_SERVICE_URL`, `DOCTOR_SERVICE_URL`, `APPOINTMENT_SERVICE_URL`, `RECORD_SERVICE_URL`, `KNOWLEDGE_SERVICE_URL`). |
| **`ai`** | `ai-prediction-service/` | Public `/ai` & `/ai/*`, plus private Service Binding (`AI_SERVICE_URL`) | Python FastAPI + CPU PyTorch / scikit-learn service (`entrypoint: app.main:app`, Large Functions `maxDuration: 300`). |
| **MongoDB Atlas** | External managed cluster | Private TLS (`mongodb+srv://`) | Preserves all 8 databases: `medimind_auth`, `medimind_family`, `medimind_hospital`, `medimind_doctor`, `medimind_appointment`, `medimind_records`, `medimind_knowledge`, and `medimind_ai`. |

### Key Platform Behaviours Preserved

1. **All 4 AI Models Preserved (`ai-prediction-service/`)**:
   - `artifacts/diabetes/best_model.joblib` (`0.03 MB`)
   - `artifacts/fracture/best_model.pt` (`42.71 MB`)
   - `artifacts/heart_disease/random_forest.joblib` (`31.12 MB`)
   - Deterministic General Health NLP triage engine (`app/models/general_health/general_health_nlp.py`)
   - `ai-prediction-service/requirements.txt` pulls CPU-only PyTorch wheels (`--extra-index-url https://download.pytorch.org/whl/cpu`), while root [`.vercelignore`](../.vercelignore) and `excludeFiles` strip `test-dataset/`, `tests/`, `scripts/`, `artifacts/experiments/`, `artifacts/fracture_v2/`, and unused checkpoints.
2. **Private Vercel Blob Direct Uploads (`> 4 MB` Radiographs)**:
   - Client uploads large radiographs directly to **Private** Vercel Blob storage via `@vercel/blob/client` -> `POST /api/ai/fracture/blob-upload` (`handleUpload` verifies client JWT + `FAMILY`/`DOCTOR` role for token issuance, validates upload pathname/`clientPayload`, and verifies upload-completion webhooks via `x-vercel-signature`), then submits `{ family_member_id, blob_url, filename }` JSON to `/api/ai/fracture`.
   - `ai-prediction-service` fetches private blobs cleanly using `Authorization: Bearer <BLOB_READ_WRITE_TOKEN>` with SSRF host validation (`ALLOWED_BLOB_HOSTS=.blob.vercel-storage.com`) and bounded streaming caps.
3. **Zero Hardcoded URLs & Zero Route Hijacking**:
   - Inter-service communication uses Vercel **Service Bindings** (`type: "service"`, `format: "url"`), so Preview and Production deployments resolve internal origins automatically with no hardcoded URLs.
   - The legacy standalone `ai-prediction-service/api/index.py` and catch-all `/api/index` rewrite were removed so `/api/*` exclusively targets Node.js `backend`, `/ai/*` targets FastAPI `ai`, and all remaining routes fall back cleanly to `frontend`.
4. **Local Development & Docker Support Unchanged**:
   - Root Docker Compose (`docker-compose.yml`) and `ai-prediction-service/Dockerfile` remain intact alongside local `npm --prefix backend run dev`, `uvicorn app.main:app`, and `npm --prefix frontend run dev`.

---

## Step-by-Step Vercel Dashboard Setup

1. **Create / Connect One Vercel Project (`medimind`)**:
   - Import the GitHub repository (`main` branch).
   - Set **Root Directory** to `.` (repository root). **Do not** split into 3 separate Vercel projects.
   - Connect Vercel **Blob** storage (**Private** access store recommended, e.g., `medimind-radiographs`) to inject `BLOB_READ_WRITE_TOKEN`.

2. **Configure Functions & Large Functions (`Settings -> Functions`)**:
   - Enable **Fluid compute** for the project (Pro/Enterprise recommended for `ai` Python ML dependencies + PyTorch CPU bundle exceeding 500 MB, up to 5 GB uncompressed).
   - Configure Function CPU / Memory in **Vercel Dashboard -> Settings -> Functions -> Function CPU** (recommended at least **1.7 vCPU / 3,008 MB RAM** or **2 vCPU / 4 GB RAM**). Note: under Fluid compute, memory cannot be specified in `vercel.json`.

3. **Configure Encrypted Environment Variables (`Settings -> Environment Variables`)**:
   Apply to Production (and Preview as appropriate; see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)):
   - **AI Large Functions**: `VERCEL_SUPPORT_LARGE_FUNCTIONS=1` (**Required** on existing Pro/Enterprise projects)
   - **Runtime & DB**: `NODE_ENV=production`, `APP_ENV=production`, `STRICT_REMOTE_DB=true`, `DISABLE_EUREKA=true`, `MONGODB_URI` / `MONGO_URI` (same Atlas `mongodb+srv://...` URI)
   - **Shared Auth**: `JWT_SECRET`, `JWT_ALGORITHM=HS256`, `INTERNAL_SERVICE_SECRET`, `INTERNAL_SERVICE_KEY`
   - **Origins**: `CORS_ORIGIN=https://medimind.vercel.app` (include any custom domain if attached; comma-separated, never `*`)
   - **Storage**: `BLOB_READ_WRITE_TOKEN`, `ALLOWED_BLOB_HOSTS=.blob.vercel-storage.com`
   - **Frontend Build Vars** (`VITE_*`): leave `VITE_API_BASE_URL` unset (or empty) for same-origin `/api/*`; optionally set `VITE_AI_SERVICE_URL=/ai` or leave unset to route via `/api/ai/*`; keep `VITE_BLOB_ACCESS=private`.
   - **Service Binding Env Vars (Auto-Injected by Vercel)**: Do **not** manually hardcode `AUTH_SERVICE_URL`, `FAMILY_SERVICE_URL`, `HOSPITAL_SERVICE_URL`, `DOCTOR_SERVICE_URL`, `APPOINTMENT_SERVICE_URL`, `RECORD_SERVICE_URL`, `KNOWLEDGE_SERVICE_URL`, or `AI_SERVICE_URL` on Vercel unless overriding temporarily — root `vercel.json` injects all of them per deployment automatically via `bindings`.

4. **MongoDB Atlas Network Access**:
   - Allow Vercel serverless egress (`0.0.0.0/0` with TLS + SCRAM credentials). Remember Vercel Large Functions cannot use Static IPs / Secure Compute.

---

## Local Development Workflow

```bash
# 1. Start local backend gateway + all 8 Express microservices (ports 5000-5006, 5008)
npm --prefix backend run dev

# 2. Start FastAPI AI prediction service (port 5007)
cd ai-prediction-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 5007

# 3. Start Vite dev server (port 5173; proxies /api -> localhost:5000 and /ai -> 127.0.0.1:5007)
npm --prefix frontend run dev
```
