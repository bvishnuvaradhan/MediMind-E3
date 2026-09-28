# MediMind — Backend Architecture & Monorepo Workspace

This document covers the **MediMind Backend Monorepo Workspace**, including the **API Gateway**, **Auth Service** (Phase 1), and **Family Service** (Phase 2), with global environment configuration, unified dependencies, and database segregation across microservices.

Cumulative implementation status is tracked in [BACKEND_PROGRESS.md](./BACKEND_PROGRESS.md).

---

## 1. Architecture & Port Allocation

```text
React Client (Frontend)
         │
         │ HTTP / REST
         ▼
┌──────────────────┐
│   API Gateway    │  Port 5000 (Reverse Proxy, JWT Verification, Anti-Spoofing, Rate Limiting)
└────────┬─────────┘
         │
         ├─── Internal HTTP + Trusted Headers ───► Auth Service   (Port 5001) ──► MongoDB (`medimind_auth`)
         │                                                                            └── `users`
         │
         └─── Internal HTTP + Trusted Headers ───► Family Service (Port 5002) ──► MongoDB (`medimind_family`)
                                                                                      ├── `families`
                                                                                      └── `family_members`
```

### Port Mappings
- **API Gateway:** `http://localhost:5000`
- **Auth Service:** `http://localhost:5001`
- **Family Service:** `http://localhost:5002`
- **Hospital Service:** `http://localhost:5003` *(Phase 3)*
- **Doctor Service:** `http://localhost:5004` *(Phase 4)*
- **Appointment Service:** `http://localhost:5005` *(Phase 5)*
- **Medical Record Service:** `http://localhost:5006` *(Phase 6)*
- **AI Service:** `http://localhost:5007` / `8000` *(Phase 7)*
- **Knowledge Service:** `http://localhost:5008` *(Phase 8)*

---

## 2. Directory & Workspace Structure

The backend operates as a single root npm workspace with hoisted, shared `node_modules`:

```text
backend/
├── package.json               # Root workspace configuration & scripts
├── package-lock.json          # Canonical dependency lockfile
├── node_modules/              # Shared, hoisted dependencies across all microservices
├── .env                       # Global environment file (local only, untracked)
├── .env.example               # Safe environment configuration template
├── .gitignore                 # Backend-wide ignore rules
├── load-env.js                # Reliable environment loader module
├── README.md                  # Backend documentation
├── BACKEND_PROGRESS.md        # Cumulative phase progress tracker
├── scripts/
│   └── start-dev.mjs          # Development runner for active microservices
├── api-gateway/               # API Gateway microservice (Port 5000)
│   ├── src/
│   ├── tests/
│   ├── jest.config.js
│   ├── package.json
│   └── server.js
├── auth-service/              # Authentication & Identity microservice (Port 5001)
│   ├── src/
│   ├── tests/
│   ├── scripts/
│   │   └── verify-phase1.mjs  # Live verification script for Gateway + Auth
│   ├── jest.config.js
│   ├── package.json
│   └── server.js
├── family-service/            # Family & Member Management microservice (Port 5002)
│   ├── src/
│   ├── tests/
│   ├── scripts/
│   │   └── verify-phase2.mjs  # Live verification script for Gateway + Auth + Family
│   ├── jest.config.js
│   ├── package.json
│   └── server.js
├── hospital-service/          # Hospital Service placeholder (Phase 3)
├── doctor-service/            # Doctor Service placeholder (Phase 4)
├── appointment-service/       # Appointment Service placeholder (Phase 5)
├── medical-record-service/    # Medical Record Service placeholder (Phase 6)
└── knowledge-service/         # Knowledge Service placeholder (Phase 7)
```

---

## 3. Global Environment Configuration

All microservices read from a single, centralized environment file at `backend/.env`.

### 3.1 Template (`backend/.env.example`)
```env
# Global MongoDB Atlas Connection (One cluster for all microservices)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority

# Logical Databases (One per microservice)
AUTH_DB_NAME=medimind_auth
FAMILY_DB_NAME=medimind_family
HOSPITAL_DB_NAME=medimind_hospital
DOCTOR_DB_NAME=medimind_doctor
APPOINTMENT_DB_NAME=medimind_appointment
RECORD_DB_NAME=medimind_records
KNOWLEDGE_DB_NAME=medimind_knowledge
AI_DB_NAME=medimind_ai

# Security & Secrets
JWT_SECRET=medimind_jwt_secret_development_key_change_in_production
JWT_EXPIRES_IN=24h
INTERNAL_SERVICE_SECRET=medimind_internal_service_secret_2026

# Microservice Port Allocations
GATEWAY_PORT=5000
AUTH_SERVICE_PORT=5001
FAMILY_SERVICE_PORT=5002
HOSPITAL_SERVICE_PORT=5003
DOCTOR_SERVICE_PORT=5004
APPOINTMENT_SERVICE_PORT=5005
RECORD_SERVICE_PORT=5006
AI_SERVICE_PORT=5007
KNOWLEDGE_SERVICE_PORT=5008

# Service URLs for API Gateway Routing
AUTH_SERVICE_URL=http://localhost:5001
FAMILY_SERVICE_URL=http://localhost:5002
HOSPITAL_SERVICE_URL=http://localhost:5003
DOCTOR_SERVICE_URL=http://localhost:5004
APPOINTMENT_SERVICE_URL=http://localhost:5005
RECORD_SERVICE_URL=http://localhost:5006
AI_SERVICE_URL=http://localhost:5007
KNOWLEDGE_SERVICE_URL=http://localhost:5008

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
NODE_ENV=development
```

### 3.2 Database Strategy
- **One Global Connection URI:** All microservices connect through the single `MONGODB_URI` connection string.
- **Isolated Logical Database:** Each microservice specifies its own logical database name via `{ dbName }` (e.g. `AUTH_DB_NAME`, `FAMILY_DB_NAME`), preventing cross-service data contamination.
- **Local Fallback:** In offline or restricted network environments, the database connection manager automatically falls back to `mongodb://127.0.0.1:27017/<DB_NAME>`.

---

## 4. Root NPM Scripts

All backend workflows are managed through standard root commands in `backend/`:

| Command | Action |
|---|---|
| `npm run dev` | Concurrently starts all implemented backend services (Gateway, Auth, Family) |
| `npm run gateway` | Starts API Gateway standalone on port `5000` |
| `npm run auth` | Starts Auth Service standalone on port `5001` |
| `npm run family` | Starts Family Service standalone on port `5002` |
| `npm test` | Runs the full automated test suite across all services |
| `npm run test:gateway` | Runs API Gateway unit & integration tests (13 tests) |
| `npm run test:auth` | Runs Auth Service unit & integration tests (23 tests) |
| `npm run test:family` | Runs Family Service unit & integration tests (22 tests) |
| `npm run verify:phase1` | Executes live end-to-end Phase 1 verification |
| `npm run verify:phase2` | Executes live end-to-end Phase 2 verification |
| `npm run lint` | Runs `oxlint` static code analysis across the entire backend |

---

## 5. Security & Invariant Checklist

- **No Hardcoded Credentials:** MongoDB connection strings, JWT secrets, and service secrets must only reside in the git-ignored local `backend/.env`.
- **Anti-Spoofing:** API Gateway unconditionally strips client-supplied `x-user-*` headers and injects verified claims from verified JWTs.
- **Role Isolation:** Microservices enforce role requirements (e.g. `FAMILY`, `DOCTOR`, `DEPARTMENT_HEAD`, `HOSPITAL_ADMIN`, `CHAIRMAN`).
- **Creator Ownership:** Destructive or modifying operations (such as member removal or family account updates) strictly verify the caller is the account creator.
