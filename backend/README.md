# MediMind — Backend Architecture & Monorepo Workspace

This document covers the **MediMind Backend Monorepo Workspace**, including the **API Gateway**, **Auth Service** (Phase 1), **Family Service** (Phase 2), **Hospital Service** (Phase 3), **Doctor Service** (Phase 4), **Appointment Service** (Phase 5), **Medical Record Service** (Phase 6), **Knowledge Service** (Phase 7), and **Final System Integration** (Phase 8), with global environment configuration, unified dependencies, and database segregation across microservices.

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
         ├─── Internal HTTP + Trusted Headers ───► Auth Service           (Port 5001) ──► MongoDB (`medimind_auth`)
         ├─── Internal HTTP + Trusted Headers ───► Family Service         (Port 5002) ──► MongoDB (`medimind_family`)
         ├─── Internal HTTP + Trusted Headers ───► Hospital Service       (Port 5003) ──► MongoDB (`medimind_hospital`)
         ├─── Internal HTTP + Trusted Headers ───► Doctor Service         (Port 5004) ──► MongoDB (`medimind_doctor`)
         ├─── Internal HTTP + Trusted Headers ───► Appointment Service    (Port 5005) ──► MongoDB (`medimind_appointment`)
         ├─── Internal HTTP + Trusted Headers ───► Medical Record Service (Port 5006) ──► MongoDB (`medimind_records`)
         └─── Internal HTTP + Trusted Headers ───► Knowledge Service      (Port 5008) ──► MongoDB (`medimind_knowledge`)
```

### Port Mappings
- **API Gateway:** `http://localhost:5000`
- **Auth Service:** `http://localhost:5001`
- **Family Service:** `http://localhost:5002`
- **Hospital Service:** `http://localhost:5003`
- **Doctor Service:** `http://localhost:5004`
- **Appointment Service:** `http://localhost:5005`
- **Medical Record Service:** `http://localhost:5006`
- **Knowledge Service:** `http://localhost:5008`
- **AI Service:** `http://localhost:5007` / `8000` *(External / Frozen)*

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
├── auth-service/              # Authentication & Identity microservice (Port 5001)
├── family-service/            # Family & Member Management microservice (Port 5002)
├── hospital-service/          # Hospital & Department Management microservice (Port 5003)
├── doctor-service/            # Doctor Profile & Availability Management microservice (Port 5004)
├── appointment-service/       # Appointment Booking & Lifecycle microservice (Port 5005)
│   ├── src/
│   ├── tests/
│   ├── scripts/
│   │   └── verify-phase5.mjs  # Live verification script for Gateway + Microservices + Appt
│   ├── jest.config.js
│   ├── package.json
├── medical-record-service/    # Medical Record Service (Port 5006, medimind_records)
│   ├── src/
│   ├── tests/
│   ├── scripts/
│   │   └── verify-phase6.mjs  # Live verification script for Gateway + Microservices + Records
│   ├── jest.config.js
│   ├── package.json
│   └── server.js
└── knowledge-service/         # Knowledge Service (Port 5008, medimind_knowledge)
    ├── src/
    ├── tests/
    ├── scripts/
    │   └── verify-phase7.mjs  # Live verification script for Gateway + Microservices + Knowledge
    ├── jest.config.js
    ├── package.json
    └── server.js
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
| `npm run dev` | Concurrently starts all implemented backend services |
| `npm run gateway` | Starts API Gateway standalone on port `5000` |
| `npm run auth` | Starts Auth Service standalone on port `5001` |
| `npm run family` | Starts Family Service standalone on port `5002` |
| `npm run hospital` | Starts Hospital Service standalone on port `5003` |
| `npm run doctor` | Starts Doctor Service standalone on port `5004` |
| `npm run appointment` | Starts Appointment Service standalone on port `5005` |
| `npm run records` | Starts Medical Record Service standalone on port `5006` |
| `npm run knowledge` | Starts Knowledge Service standalone on port `5008` |
| `npm test` | Runs the full automated test suite across all 8 microservices (244 tests) |
| `npm run test:gateway` | Runs API Gateway unit & integration tests (13 tests) |
| `npm run test:auth` | Runs Auth Service unit & integration tests (23 tests) |
| `npm run test:family` | Runs Family Service unit & integration tests (22 tests) |
| `npm run test:hospital` | Runs Hospital Service unit & integration tests (38 tests) |
| `npm run test:doctor` | Runs Doctor Service unit & integration tests (49 tests) |
| `npm run test:appointment` | Runs Appointment Service unit & integration tests (26 tests) |
| `npm run test:records` | Runs Medical Record Service unit & integration tests (40 tests) |
| `npm run test:knowledge` | Runs Knowledge Service unit & integration tests (35 tests) |
| `npm run verify:phase1` | Executes live end-to-end Phase 1 verification (Auth + Gateway) |
| `npm run verify:phase2` | Executes live end-to-end Phase 2 verification (Family + Gateway) |
| `npm run verify:phase3` | Executes live end-to-end Phase 3 verification (Hospital + Gateway) |
| `npm run verify:phase4` | Executes live end-to-end Phase 4 verification (Doctor + Gateway) |
| `npm run verify:phase5` | Executes live end-to-end Phase 5 verification (Appointment + Gateway) |
| `npm run verify:phase6` | Executes live end-to-end Phase 6 verification (Records + Gateway) |
| `npm run verify:phase7` | Executes live end-to-end Phase 7 verification (Knowledge + Gateway) |
| `npm run verify:phase8` | Executes live end-to-end Phase 8 final system integration (All services + Gateway + 17 negatives) |
| `npm run lint` | Runs `oxlint` static code analysis across the entire backend |

---

## 5. Security & Invariant Checklist

- **No Hardcoded Credentials:** MongoDB connection strings, JWT secrets, and service secrets must only reside in the git-ignored local `backend/.env`.
- **Anti-Spoofing:** API Gateway unconditionally strips client-supplied `x-user-*` headers and injects verified claims from verified JWTs.
- **Role Isolation:** Microservices enforce role requirements (e.g. `FAMILY`, `DOCTOR`, `DEPARTMENT_HEAD`, `HOSPITAL_ADMIN`, `CHAIRMAN`).
- **Creator Ownership:** Destructive or modifying operations (such as member removal or family account updates) strictly verify the caller is the account creator.
