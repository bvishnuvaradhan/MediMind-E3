# MediMind Environment Variables Reference

> **Security Rule:** Never commit `.env` files, MongoDB credentials, JWT signing keys, or third-party API keys to Git. Use the checked-in `.env.example` templates as a structural reference only, and store real secrets in Vercel Project Settings or your container provider's encrypted secret manager.

---

## 1. Frontend (`frontend/`)

Template: [frontend/.env.example](../frontend/.env.example)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes (Prod)** | Empty (`""` uses Vite proxy `/api`) | Full HTTPS origin of the deployed Backend API Gateway (no trailing slash), e.g. `https://medimind-api.vercel.app`. |
| `VITE_AI_SERVICE_URL` | Optional | Falls back to `VITE_API_BASE_URL` | Optional direct origin of the Python AI Prediction Service for multipart X-ray radiograph uploads (`/api/ai/fracture`) to avoid Vercel's 4.5 MB request payload limit. |

---

## 2. Node.js Backend Monorepo & Microservices (`backend/`)

Template: [backend/.env.example](../backend/.env.example)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes (Prod)** | `development` | Set to `production` on Vercel. Enforces strict CORS, disables `.env` file loading, and enables strict remote DB checks. |
| `STRICT_REMOTE_DB` | Recommended (`true` in Prod) | `false` (`true` automatically when `VERCEL` is set) | Rejects `localhost`/`127.0.0.1` MongoDB URIs and requires `mongodb+srv://` or remote Atlas hosts. |
| `MONGODB_URI` | **Yes** | None in prod/Vercel | MongoDB Atlas SRV connection string (must not target localhost in production). |
| `MONGO_URI` | Alternative | Falls back to `MONGODB_URI` | Accepted alias across Node services when `MONGODB_URI` is not set. |
| `MONGO_TIMEOUT_MS` | Optional | `10000` | Mongoose `serverSelectionTimeoutMS` in milliseconds. |
| `JWT_SECRET` | **Yes** | **No fallback** (throws if unset) | Cryptographically strong secret shared identically across `api-gateway`, all 8 Node services, and `ai-prediction-service`. |
| `JWT_EXPIRES_IN` | Optional | `24h` | JWT expiration duration used by `auth-service`. |
| `INTERNAL_SERVICE_SECRET` | **Yes** | **No fallback** (throws if unset) | Shared secret sent in `x-internal-service-secret` headers for service-to-service trust. |
| `INTERNAL_SERVICE_KEY` | Recommended | Falls back to `INTERNAL_SERVICE_SECRET` | Shared key sent in `x-internal-service-key` headers when communicating with `ai-prediction-service`. |
| `CORS_ORIGIN` | **Yes (Prod)** | Dev defaults `http://localhost:5173,http://localhost:3000`; empty `[]` in prod | Comma-separated list of allowed browser origins (wildcard `*` is stripped automatically in production/Vercel). |
| `AI_SERVICE_URL` | **Yes (Prod / Vercel)** | `http://127.0.0.1:5007` locally; **throws on Vercel if unset** | Full HTTPS origin of the externally hosted Python AI Prediction Service. |
| `AUTH_DB_NAME` | Optional | `medimind_auth` | Logical database name for Auth Service. |
| `FAMILY_DB_NAME` | Optional | `medimind_family` | Logical database name for Family Service. |
| `HOSPITAL_DB_NAME` | Optional | `medimind_hospital` | Logical database name for Hospital Service. |
| `DOCTOR_DB_NAME` | Optional | `medimind_doctor` | Logical database name for Doctor Service. |
| `APPOINTMENT_DB_NAME` | Optional | `medimind_appointment` | Logical database name for Appointment Service. |
| `RECORD_DB_NAME` | Optional | `medimind_records` | Logical database name for Medical Record Service (`recordDb`). |
| `KNOWLEDGE_DB_NAME` | Optional | `medimind_knowledge` | Logical database name for Knowledge Service. |
| `AUTH_SERVICE_URL`, `FAMILY_SERVICE_URL`, `HOSPITAL_SERVICE_URL`, `DOCTOR_SERVICE_URL`, `APPOINTMENT_SERVICE_URL`, `RECORD_SERVICE_URL`, `KNOWLEDGE_SERVICE_URL` | Optional | On Vercel, auto-resolves via `https://$VERCEL_PROJECT_PRODUCTION_URL/_internal/<slug>`; locally defaults to `127.0.0.1:<port>` | Explicit URL overrides if deploying individual Node microservices to separate Vercel Projects or hosts. |
| `EUREKA_ENABLED`, `EUREKA_SERVER_URL` | Optional (Dev only) | `false` / unset | Disabled automatically in `production`, `test`, or `VERCEL` environments. |
| `KAFKA_ENABLED`, `KAFKA_BROKERS` | Optional (Dev only) | `false` / unset | Disabled automatically in `production`, `test`, or `VERCEL` environments. |
| `GATEWAY_PORT`, `AUTH_SERVICE_PORT`, `FAMILY_SERVICE_PORT`, `HOSPITAL_SERVICE_PORT`, `DOCTOR_SERVICE_PORT`, `APPOINTMENT_SERVICE_PORT`, `RECORD_SERVICE_PORT`, `KNOWLEDGE_SERVICE_PORT` | Local Dev only | `5000`..`5006`, `5008` | Listening ports used by `server.js` in local development; ignored by Vercel serverless handlers. |

---

## 3. Python FastAPI AI Prediction Service (`ai-prediction-service/`)

Template: [ai-prediction-service/.env.example](../ai-prediction-service/.env.example)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `APP_ENV` | **Yes (Prod)** | `development` (`production` in `Dockerfile` & `render.yaml`) | Controls strict database/secret validation and disables dev conveniences like Eureka. |
| `PORT` | Container / Dev | `5007` | Listening port bound by Uvicorn in Docker (`${PORT:-5007}`). |
| `STRICT_REMOTE_DB` | **Yes (Prod)** | `false` (`true` in `render.yaml` & `APP_ENV=production`) | Rejects localhost URIs and disables in-memory `_memory_store` fallback so DB outages fail loudly rather than faking persistence. |
| `MONGO_URI` | **Yes** | Required (`localhost` forbidden in prod) | MongoDB Atlas connection string (`mongodb+srv://...`). |
| `DB_NAME` | Optional | `medimind_ai` | Logical MongoDB database name for AI predictions. |
| `JWT_SECRET` | **Yes** | **No fallback** in runtime auth | Must match the Node.js Backend `JWT_SECRET`. |
| `JWT_ALGORITHM` | Optional | `HS256` | JWT verification algorithm. |
| `INTERNAL_SERVICE_KEY` | **Yes** | Must match Backend | Shared internal key verified on internal gateway/appointment calls. |
| `CORS_ORIGIN` | Recommended | Dev localhost list | Comma-separated origins (include Frontend Vercel URL and Backend Gateway URL). |
| `DISABLE_EUREKA` / `EUREKA_ENABLED` | Optional | `true` / `false` | Keeps Eureka registration disabled in production containers. |
| `GROQ_ENABLED` | Optional | `false` | Enables optional natural-language patient explanations via Groq. |
| `GROQ_API_KEY` | Conditional | Empty | Required only if `GROQ_ENABLED=true`. Inference models continue working with zero dependency if Groq fails or is disabled. |
| `GROQ_MODEL` | Optional | `llama3-8b-8192` | Groq chat completion model identifier when `GROQ_ENABLED=true`. |
