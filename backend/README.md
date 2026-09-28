# MediMind — Backend Architecture & Services

This document covers the **API Gateway**, **Auth Service** (Phase 1), and **Family Service** (Phase 2) implementations in accordance with the locked specifications in `Documents/Backend/`.

---

## 1. Architecture & Port Allocation

```text
React Client (Frontend)
         │
         │ HTTP / REST
         ▼
┌──────────────────┐
│   API Gateway    │  Port 5000
└────────┬─────────┘
         │
         ├─── Internal HTTP + Trusted Headers + Correlation ID ───► Auth Service   (Port 5001) ──► MongoDB (`medimind_auth`)
         │                                                                                            └── `users`
         │
         └─── Internal HTTP + Trusted Headers + Correlation ID ───► Family Service (Port 5002) ──► MongoDB (`medimind_family`)
                                                                                                      ├── `families`
                                                                                                      └── `family_members`
```

- **API Gateway:** `http://localhost:5000`
- **Auth Service:** `http://localhost:5001` (`medimind_auth`)
- **Family Service:** `http://localhost:5002` (`medimind_family`)

---

## 2. Directory Structure

```text
backend/
├── api-gateway/
│   ├── src/
│   │   ├── config/
│   │   │   └── services.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── roleMiddleware.js
│   │   │   ├── securityMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── familyRoutes.js
│   │   │   ├── hospitalRoutes.js
│   │   │   ├── doctorRoutes.js
│   │   │   ├── appointmentRoutes.js
│   │   │   ├── recordRoutes.js
│   │   │   ├── aiRoutes.js
│   │   │   └── knowledgeRoutes.js
│   │   ├── utils/
│   │   │   └── proxy.js
│   │   └── app.js
│   ├── tests/
│   │   └── gateway.test.js
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
├── auth-service/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   └── authController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── errorMiddleware.js
│   │   ├── models/
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   └── authRoutes.js
│   │   ├── services/
│   │   │   └── authService.js
│   │   ├── utils/
│   │   │   ├── jwt.js
│   │   │   └── password.js
│   │   └── app.js
│   ├── tests/
│   │   └── auth.test.js
│   ├── scripts/
│   │   └── verify-phase1.mjs
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── family-service/
    ├── src/
    │   ├── config/
    │   │   └── db.js
    │   ├── controllers/
    │   │   ├── familyController.js
    │   │   └── familyMemberController.js
    │   ├── middleware/
    │   │   ├── authMiddleware.js
    │   │   └── errorMiddleware.js
    │   ├── models/
    │   │   ├── Family.js
    │   │   └── FamilyMember.js
    │   ├── routes/
    │   │   ├── familyRoutes.js
    │   │   └── familyMemberRoutes.js
    │   ├── services/
    │   │   ├── familyService.js
    │   │   └── familyMemberService.js
    │   ├── utils/
    │   │   └── responseEnvelope.js
    │   └── app.js
    ├── tests/
    │   ├── family.test.js
    │   └── familyMember.test.js
    ├── scripts/
    │   └── verify-phase2.mjs
    ├── .env.example
    ├── .gitignore
    ├── package.json
    └── server.js
```

---

## 3. Environment Variables

### 3.1 API Gateway (`backend/api-gateway/.env.example`)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=medimind_jwt_secret_development_key_change_in_production
INTERNAL_SERVICE_SECRET=medimind_internal_service_secret_2026
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

AUTH_SERVICE_URL=http://localhost:5001
FAMILY_SERVICE_URL=http://localhost:5002
HOSPITAL_SERVICE_URL=http://localhost:5003
DOCTOR_SERVICE_URL=http://localhost:5004
APPOINTMENT_SERVICE_URL=http://localhost:5005
RECORD_SERVICE_URL=http://localhost:5006
AI_SERVICE_URL=http://localhost:5007
KNOWLEDGE_SERVICE_URL=http://localhost:5008
```

### 3.2 Auth Service (`backend/auth-service/.env.example`)
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/medimind_auth
JWT_SECRET=medimind_jwt_secret_development_key_change_in_production
JWT_EXPIRES_IN=24h
INTERNAL_SERVICE_SECRET=medimind_internal_service_secret_2026
CORS_ORIGIN=http://localhost:5173,http://localhost:5000
```

### 3.3 Family Service (`backend/family-service/.env.example`)
```env
PORT=5002
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/medimind_family
JWT_SECRET=medimind_jwt_secret_development_key_change_in_production
INTERNAL_SERVICE_SECRET=medimind_internal_service_secret_2026
CORS_ORIGIN=http://localhost:5173,http://localhost:5000
```

---

## 4. Family Service API Contracts & Scoping Rules

### 4.1 Endpoints
| Method | Path | Auth Required | Role | Description |
|---|---|---|---|---|
| `POST` | `/api/families` | No (Public) | — | Create new family account |
| `GET` | `/api/families/me` | Yes (JWT) | `FAMILY` | Get authenticated family profile |
| `PUT` | `/api/families/me` | Yes (JWT) | `FAMILY` | Update authenticated family profile (creator only) |
| `POST` | `/api/families/members` | Yes (JWT) | `FAMILY` | Add new family member |
| `GET` | `/api/families/members` | Yes (JWT) | `FAMILY` | List active members of caller family |
| `GET` | `/api/families/members/:memberId` | Yes (JWT) | `FAMILY` | Get single member by ID (scoped to caller family) |
| `PUT` | `/api/families/members/:memberId` | Yes (JWT) | `FAMILY` | Update single member by ID (scoped to caller family) |
| `DELETE` | `/api/families/members/:memberId` | Yes (JWT) | `FAMILY` | Soft-delete member (creator only) |
| `GET` | `/health` | No | — | Service health check |

### 4.2 Security & Scoping Invariants
1. **Family Isolation**: A family user can only view, update, and manage members belonging to their own `family_id`. Attempting to access another family's member ID returns `403 Forbidden`.
2. **Creator-Only Operations**: Updating the family account profile and soft-deleting members is restricted to the family creator (`creator_user_id === req.user.userId`).
3. **Soft Deletion**: `DELETE /api/families/members/:memberId` marks the member status as `REMOVED` and populates `deleted_at`. Active member listings exclude removed members.
4. **Anti-Spoofing**: Identity headers (`x-user-id`, `x-user-role`, `x-user-reference-id`) passed across the Gateway are stripped from the external client and reconstructed from verified JWT claims.

---

## 5. Execution & Testing Instructions

### 5.1 Starting Microservices
```bash
# 1. Start Auth Service (Port 5001)
cd backend/auth-service && npm start

# 2. Start Family Service (Port 5002)
cd backend/family-service && npm start

# 3. Start API Gateway (Port 5000)
cd backend/api-gateway && npm start
```

### 5.2 Running Automated Test Suites
- **Auth Service Tests (23 tests):**
  ```bash
  cd backend/auth-service
  npm test
  ```
- **API Gateway Tests (13 tests):**
  ```bash
  cd backend/api-gateway
  npm test
  ```
- **Family Service Tests (22 tests):**
  ```bash
  cd backend/family-service
  npm test
  ```

### 5.3 Running Live Integration Verification
- **Phase 1 Verification (Gateway + Auth Service):**
  ```bash
  cd backend/auth-service
  node scripts/verify-phase1.mjs
  ```
- **Phase 2 Verification (Gateway + Auth Service + Family Service):**
  ```bash
  cd backend/family-service
  node scripts/verify-phase2.mjs
  ```
