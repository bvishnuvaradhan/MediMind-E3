# MediMind Environment Variables Reference (Single Vercel Project)

> **Security Rule:** Never commit `.env` files, MongoDB credentials, JWT signing keys, or third-party API keys to Git. Configure all secrets in **Project Settings -> Environment Variables** inside your single **`medimind`** Vercel project.

---

## 1. Frontend Build Variables (`frontend/`)

Template: [frontend/.env.example](../frontend/.env.example)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Optional | Empty (`""`) | Leave empty in the single-project Vercel deployment (`medimind.vercel.app`) to use same-origin `/api/*` (and Vite dev proxy locally). |
| `VITE_AI_SERVICE_URL` | Optional | Empty (`""`, uses `/api/ai/*`) | Leave empty to send AI calls through the Node API Gateway (`/api/ai/*`), or set to `/ai` to hit the FastAPI Vercel Service rewrite directly. |
| `VITE_BLOB_ACCESS` | Optional | `private` | Controls `@vercel/blob/client` access mode (`private` by default for clinical radiographs). Set `public` only for a public Blob store. |

---

## 2. Node.js Backend Services (`backend/api-gateway` & 7 Microservices)

Template: [backend/.env.example](../backend/.env.example)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes (Prod)** | `development` | Set to `production` on Vercel. |
| `STRICT_REMOTE_DB` | Recommended | `true` automatically on Vercel | Rejects localhost URIs and enforces remote Atlas connections. |
| `MONGODB_URI` | **Yes** | None in prod | MongoDB Atlas `mongodb+srv://...` connection string. |
| `MONGO_TIMEOUT_MS` | Optional | `10000` | Mongoose server selection timeout (ms). |
| `JWT_SECRET` | **Yes** | Throws if unset | Shared cryptographic secret matching all Node services and AI service. |
| `JWT_EXPIRES_IN` | Optional | `24h` | JWT expiry for `auth-service`. |
| `INTERNAL_SERVICE_SECRET` | **Yes** | Throws if unset | Internal service trust header (`x-internal-service-secret`). |
| `INTERNAL_SERVICE_KEY` | Recommended | Falls back to `INTERNAL_SERVICE_SECRET` | Shared key (`X-Internal-Service-Key`) sent to FastAPI AI service. |
| `CORS_ORIGIN` | **Yes (Prod)** | Dev localhost origins | Comma-separated allowed browser origins (`https://medimind.vercel.app`; `*` blocked in prod). |
| `BLOB_READ_WRITE_TOKEN` | **Yes (Prod)** | None | Vercel Blob token used by `POST /api/ai/fracture/blob-upload` (`@vercel/blob/client`) and Private Blob reads. |
| `AUTH_SERVICE_URL`, `FAMILY_SERVICE_URL`, `HOSPITAL_SERVICE_URL`, `DOCTOR_SERVICE_URL`, `APPOINTMENT_SERVICE_URL`, `RECORD_SERVICE_URL`, `KNOWLEDGE_SERVICE_URL`, `AI_SERVICE_URL` | Auto-injected on Vercel | Local `http://127.0.0.1:<port>` | **Automatically injected per deployment by Vercel Service Bindings** in root [`vercel.json`](../vercel.json). Do not hardcode deployment URLs in Vercel env settings. |
| `AUTH_DB_NAME`, `FAMILY_DB_NAME`, `HOSPITAL_DB_NAME`, `DOCTOR_DB_NAME`, `APPOINTMENT_DB_NAME`, `RECORD_DB_NAME`, `KNOWLEDGE_DB_NAME` | Optional | Canonical `medimind_*` names | Logical MongoDB database names. |
| `EUREKA_ENABLED`, `KAFKA_ENABLED` | Dev only | `false` | Disabled automatically on Vercel / production. |

---

## 3. Python FastAPI AI Service (`ai-prediction-service/`)

Template: [ai-prediction-service/.env.example](../ai-prediction-service/.env.example)

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VERCEL_SUPPORT_LARGE_FUNCTIONS` | **Yes (Vercel Pro/Ent)** | `1` | Unlocks Fluid compute **5 GB** uncompressed Python bundle limit for CPU PyTorch + scikit-learn + model weights. |
| `APP_ENV` | **Yes (Prod)** | `development` | Set to `production`. Forces strict Atlas DB validation and strict CORS. |
| `STRICT_REMOTE_DB` | **Yes (Prod)** | `true` on Vercel / prod | Prohibits localhost URIs and disables transient `_memory_store` fallback. |
| `MONGO_URI` / `MONGODB_URI` | **Yes** | Throws in prod if missing/localhost | MongoDB Atlas connection string (`mongodb+srv://...`). |
| `DB_NAME` | Optional | `medimind_ai` | Logical MongoDB database name for AI predictions. |
| `JWT_SECRET` | **Yes** | Throws if unset | Must match Backend `JWT_SECRET`. |
| `JWT_ALGORITHM` | Optional | `HS256` | JWT signing algorithm. |
| `INTERNAL_SERVICE_KEY` | **Yes** | Throws if unset | Must match Backend `INTERNAL_SERVICE_KEY`. |
| `CORS_ORIGIN` | **Yes (Prod)** | Dev localhost origins | Comma-separated allowed origins (e.g. `https://medimind.vercel.app`). |
| `BLOB_READ_WRITE_TOKEN` | **Yes (Private Blob)** | Empty | Required in AI service to download radiographs stored in Private Vercel Blob stores (`Authorization: Bearer ...`). |
| `ALLOWED_BLOB_HOSTS` | Optional | `.blob.vercel-storage.com` | Comma-separated SSRF host allowlist for `blob_url` radiograph downloads. |
| `DISABLE_EUREKA` / `EUREKA_ENABLED` | Optional | `true` / `false` | Keeps Eureka registration disabled in serverless/production. |
| `GROQ_ENABLED`, `GROQ_API_KEY`, `GROQ_MODEL` | Optional | `false` / empty / `llama3-8b-8192` | Optional non-blocking Groq explanation enrichment. |
