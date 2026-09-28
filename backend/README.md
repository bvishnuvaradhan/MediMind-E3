# MediMind — Backend Foundation (Phase 1: API Gateway + Auth Service)

This document covers the **API Gateway** and **Auth Service** implementation in accordance with the specifications in `Documents/Backend/`.

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
         │ Internal HTTP + Trusted Headers + Correlation ID
         ▼
┌──────────────────┐
│   Auth Service   │  Port 5001
└────────┬─────────┘
         │
         ▼
  MongoDB Atlas (`medimind_auth`)
    └── `users` collection
```

- **API Gateway:** `http://localhost:5000`
- **Auth Service:** `http://localhost:5001`
- **Database:** `mongodb://127.0.0.1:27017/medimind_auth`

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
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
│
└── auth-service/
    ├── src/
    │   ├── config/
    │   │   └── db.js
    │   ├── controllers/
    │   │   └── authController.js
    │   ├── middleware/
    │   │   ├── authMiddleware.js
    │   │   └── errorMiddleware.js
    │   ├── models/
    │   │   └── User.js
    │   ├── routes/
    │   │   └── authRoutes.js
    │   ├── services/
    │   │   └── authService.js
    │   ├── utils/
    │   │   ├── jwt.js
    │   │   └── password.js
    │   └── app.js
    ├── tests/
    │   └── auth.test.js
    ├── scripts/
    │   └── verify-phase1.mjs
    ├── .env
    │── .env.example
    ├── .gitignore
    ├── package.json
    └── server.js
```

---

## 3. Environment Variables

### 3.1 API Gateway (`backend/api-gateway/.env`)
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

### 3.2 Auth Service (`backend/auth-service/.env`)
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/medimind_auth
JWT_SECRET=medimind_jwt_secret_development_key_change_in_production
JWT_EXPIRES_IN=24h
INTERNAL_SERVICE_SECRET=medimind_internal_service_secret_2026
CORS_ORIGIN=http://localhost:5173,http://localhost:5000
```

---

## 4. Authentication, Security & Routing Flows

### 4.1 Login Flow
1. Client sends `POST /api/auth/login` with `{ email, password }` to API Gateway.
2. Gateway applies rate limiting (`authRateLimiter`) and forwards request to Auth Service.
3. Auth Service finds user in `medimind_auth.users`, verifies password hash via `bcryptjs`, and checks `status === 'ACTIVE'`.
4. Auth Service generates a signed JWT containing `{ userId, role, referenceId }`.
5. Client receives standard envelope:
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "token": "<JWT_TOKEN>",
       "user": {
         "userId": "...",
         "email": "...",
         "role": "DOCTOR",
         "accountType": "DOCTOR_ACCOUNT",
         "referenceId": "..."
       }
     }
   }
   ```

### 4.2 Protected Routing & Anti-Spoofing
1. For protected routes (`/me`, `/change-password`, or any domain microservice), client sends `Authorization: Bearer <token>`.
2. Gateway verifies token validity using `JWT_SECRET`. If missing/expired/invalid, Gateway immediately rejects with 401.
3. Anti-Spoofing Sanitization: Gateway removes any client-supplied `x-user-id`, `x-user-role`, `x-user-reference-id`, or `x-internal-service-secret`.
4. Trusted Identity Injection: Gateway extracts decoded claims and injects verified trusted headers:
   - `x-user-id`: `decoded.userId`
   - `x-user-role`: `decoded.role`
   - `x-user-reference-id`: `decoded.referenceId`
   - `x-internal-service-secret`: shared secret between Gateway and services
   - `x-request-id`: generated or preserved correlation ID
5. Downstream microservice receives verified headers directly from Gateway.

---

## 5. Execution & Testing Instructions

### 5.1 Starting Auth Service
```bash
cd backend/auth-service
npm install
npm start
```
Auth Service starts on port 5001. Health check: `GET http://localhost:5001/health`.

### 5.2 Starting API Gateway
```bash
cd backend/api-gateway
npm install
npm start
```
API Gateway starts on port 5000. Health check: `GET http://localhost:5000/health`.

### 5.3 Running Automated Tests
- **Auth Service Unit & Integration Tests:**
  ```bash
  cd backend/auth-service
  npm test
  ```
  Executes 23 tests covering password utilities, JWT generation/validation, user models for all 5 roles, login/logout, password changing, and error conditions.

- **API Gateway Tests:**
  ```bash
  cd backend/api-gateway
  npm test
  ```
  Executes 13 tests covering public/protected routing, JWT verification, token forwarding, anti-spoofing header protection, internal service authentication, role middleware, and 503/404 error handling.

- **End-to-End Live Integration Check:**
  ```bash
  cd backend/auth-service
  node scripts/verify-phase1.mjs
  ```
  Spins up live Gateway and Auth Service instances connected to MongoDB, executes complete authentication, token verification, anti-spoofing, and logout journeys.
