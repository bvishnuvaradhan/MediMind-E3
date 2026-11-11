# MediMind Environment Variables Reference

> **Security Rule:** Never commit `.env` files, MongoDB credentials, JWT signing keys, or third-party API keys to Git. Store all secrets in each Vercel Project's encrypted Environment Variables settings.

---

## 1. Frontend (`frontend/` — Vercel Project 1)

Template: [frontend/.env.example](../frontend/.env.example)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes (Prod)** | Empty (`""` uses Vite proxy `/api`) | Full HTTPS origin of Backend API Gateway Vercel deployment (no trailing slash). |
| `VITE_AI_SERVICE_URL` | Recommended | Falls back to `VITE_API_BASE_URL` | Full HTTPS origin of Python AI Service Vercel deployment (no trailing slash). |
| `VITE_BLOB_ACCESS` | Optional | `public` | Set to `private` only if your Vercel Blob store uses Private access. |

---

## 2. Node.js Backend (`backend/` — Vercel Project 2)

Template: [backend/.env.example](../backend/.env.example)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes (Prod)** | `development` | Set to `production` on Vercel. |
| `STRICT_REMOTE_DB` | Recommended | `true` automatically on Vercel | Rejects localhost URIs and enforces remote Atlas connections. |
| `MONGODB_URI` / `MONGO_URI` | **Yes** | None in prod | MongoDB Atlas `mongodb+srv://...` connection string. |
| `MONGO_TIMEOUT_MS` | Optional | `10000` | Mongoose server selection timeout (ms). |
| `JWT_SECRET` | **Yes** | Throws if unset | Shared cryptographic secret matching all Node services and AI service. |
| `JWT_EXPIRES_IN` | Optional | `24h` | JWT expiry for `auth-service`. |
| `INTERNAL_SERVICE_SECRET` | **Yes** | Throws if unset | Internal service trust header (`x-internal-service-secret`). |
| `INTERNAL_SERVICE_KEY` | Recommended | Falls back to `INTERNAL_SERVICE_SECRET` | Shared key (`X-Internal-Service-Key`) sent to FastAPI AI service. |
| `CORS_ORIGIN` | **Yes (Prod)** | Dev localhost origins | Comma-separated allowed browser origins (`*` blocked in prod). |
| `AI_SERVICE_URL` | **Yes (Prod)** | Throws on Vercel if unset | Full HTTPS URL of Vercel Python AI service deployment. |
| `BLOB_READ_WRITE_TOKEN` | **Yes (Prod)** | None | Vercel Blob token used by `POST /api/ai/fracture/blob-upload` (`@vercel/blob/client`). |
| `AUTH_DB_NAME`, `FAMILY_DB_NAME`, `HOSPITAL_DB_NAME`, `DOCTOR_DB_NAME`, `APPOINTMENT_DB_NAME`, `RECORD_DB_NAME`, `KNOWLEDGE_DB_NAME` | Optional | Canonical `medimind_*` names | Logical MongoDB database names. |
| `EUREKA_ENABLED`, `KAFKA_ENABLED` | Dev only | `false` | Disabled automatically on Vercel / production. |

---

## 3. Python FastAPI AI Service (`ai-prediction-service/` — Vercel Project 3)

Template: [ai-prediction-service/.env.example](../ai-prediction-service/.env.example)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VERCEL_SUPPORT_LARGE_FUNCTIONS` | **Yes (Vercel Pro/Ent)** | `1` (required for existing projects) | Unlocks Fluid compute **5 GB** uncompressed Python bundle limit for PyTorch + scikit-learn + model weights. |
| `APP_ENV` | **Yes (Prod)** | `development` | Set to `production`. Forces strict Atlas DB validation and strict CORS. |
| `STRICT_REMOTE_DB` | **Yes (Prod)** | `true` on Vercel / prod | Prohibits localhost URIs and disables transient `_memory_store` fallback. |
| `MONGO_URI` / `MONGODB_URI` | **Yes** | Throws in prod if missing/localhost | MongoDB Atlas connection string (`mongodb+srv://...`). |
| `DB_NAME` | Optional | `medimind_ai` | Logical MongoDB database name for AI predictions. |
| `JWT_SECRET` | **Yes** | Throws if unset | Must match Backend `JWT_SECRET`. |
| `JWT_ALGORITHM` | Optional | `HS256` | JWT signing algorithm. |
| `INTERNAL_SERVICE_KEY` | **Yes** | Throws if unset | Must match Backend `INTERNAL_SERVICE_KEY`. |
| `CORS_ORIGIN` | **Yes (Prod)** | Dev localhost origins | Comma-separated allowed origins (include Frontend Vercel origin and Backend Gateway Vercel origin). |
| `BLOB_READ_WRITE_TOKEN` | Conditional | Empty | Required in AI service only if fetching from a Private Vercel Blob store. |
| `ALLOWED_BLOB_HOSTS` | Optional | `.blob.vercel-storage.com` | Comma-separated SSRF host allowlist for `blob_url` radiograph downloads. |
| `DISABLE_EUREKA` / `EUREKA_ENABLED` | Optional | `true` / `false` | Keeps Eureka registration disabled in serverless/production. |
| `GROQ_ENABLED`, `GROQ_API_KEY`, `GROQ_MODEL` | Optional | `false` / empty / `llama3-8b-8192` | Optional non-blocking Groq explanation enrichment. |
