# MediMind — Master Architecture & Technical Systems Documentation

**Document ID:** `MM-MASTER-002`  
**Document Class:** System Architecture & Infrastructure Specification  
**Publication Date:** November 4, 2026  
**Repository:** `D:\projects\MediMind`  
**Active Branch:** `experiment8-multiview-localized-fusion`  
**Authors:** Senior Microservices Architect & Infrastructure Engineer  

---

## 1. Architectural Topology & Microservices Overview

MediMind operates as an event-driven, distributed service-oriented architecture (SOA) comprising an edge API Gateway, dedicated domain microservices, a high-performance Python FastAPI AI Prediction Service, an Apache Kafka event backbone, and a Netflix Eureka service registry:

```mermaid
graph TD
    UI["React + Vite Client\n(Port 5173)"]
    GW["Node.js API Gateway\n(Port 5000)"]
    EUR["Netflix Eureka Server\n(Port 8761)"]
    KAFKA["Apache Kafka Broker\n(Port 9092 / KRaft)"]

    subgraph Domain Microservices Layer
        AUTH["AUTH-SERVICE\n(Port 5001)"]
        FAM["FAMILY-SERVICE\n(Port 5002)"]
        HOSP["HOSPITAL-SERVICE\n(Port 5003)"]
        DOC["DOCTOR-SERVICE\n(Port 5004)"]
        APPT["APPOINTMENT-SERVICE\n(Port 5005)"]
        MED["MEDICAL-RECORD-SERVICE\n(Port 5006)"]
        KNOW["KNOWLEDGE-SERVICE\n(Port 5008)"]
    end

    subgraph Clinical AI Inference Core
        AI["AI-PREDICTION-SERVICE\n(FastAPI - Port 5007)"]
    end

    subgraph Data Tier (MongoDB Atlas)
        DB_AUTH[("medimind_auth")]
        DB_DOC[("medimind_doctor")]
        DB_FAM[("medimind_family")]
        DB_HOSP[("medimind_hospital")]
        DB_APPT[("medimind_appointment")]
    end

    UI -->|HTTP / REST| GW
    GW <-->|Heartbeat & Discovery| EUR
    GW -->|Forward Proxy| AUTH
    GW -->|Forward Proxy| FAM
    GW -->|Forward Proxy| HOSP
    GW -->|Forward Proxy| DOC
    GW -->|Forward Proxy| APPT
    GW -->|Forward Proxy| MED
    GW -->|Forward Proxy| KNOW
    GW -->|Forward Proxy| AI

    AUTH --> DB_AUTH
    DOC --> DB_DOC
    FAM --> DB_FAM
    HOSP --> DB_HOSP
    APPT --> DB_APPT
    MED --> DB_APPT

    AUTH -.->|Discovery| EUR
    FAM -.->|Discovery| EUR
    HOSP -.->|Discovery| EUR
    DOC -.->|Discovery| EUR
    APPT -.->|Discovery| EUR
    MED -.->|Discovery| EUR
    KNOW -.->|Discovery| EUR
    AI -.->|Discovery| EUR

    APPT ==>|Publish Event| KAFKA
    AI ==>|Publish Prediction| KAFKA
```

---

## 2. Service Inventory & Port Allocations

| Service Identifier | Technology Stack | Port | Primary Responsibilities & Clinical Scope | Eureka App Name |
|---|---|---|---|---|
| **EUREKA-SERVER** | Spring Boot / Java | `8761` | Central service discovery registry, instance heartbeat monitoring, and health status reporting. | `EUREKA-SERVER` |
| **KAFKA-BROKER** | Apache Kafka (KRaft) | `9092` | Distributed event streaming broker managing real-time clinical topics (`appointment-events`, `ai-predictions`). | N/A |
| **API-GATEWAY** | Node.js / Express | `5000` | Edge reverse proxy, JWT bearer token validation, CORS routing, rate limiting, and multipart stream forwarding. | `API-GATEWAY` |
| **AUTH-SERVICE** | Node.js / Express / Mongoose | `5001` | User registration, bcrypt authentication, JWT token issuance, password hashing, and role claims verification. | `AUTH-SERVICE` |
| **FAMILY-SERVICE** | Node.js / Express / Mongoose | `5002` | Family account governance, patient profile CRUD, relationship management, and emergency contact registry. | `FAMILY-SERVICE` |
| **HOSPITAL-SERVICE** | Node.js / Express / Mongoose | `5003` | Facility master directories, departmental listings, ward allocations, and hospital-wide operational metrics. | `HOSPITAL-SERVICE` |
| **DOCTOR-SERVICE** | Node.js / Express / Mongoose | `5004` | Attending doctor profiles, specialties, consultation fee schedules, and weekly recurring availability slots. | `DOCTOR-SERVICE` |
| **APPOINTMENT-SERVICE** | Node.js / Express / Mongoose | `5005` | Booking engine, status transition state machine, walk-in registration, and appointment rescheduling. | `APPOINTMENT-SERVICE` |
| **MEDICAL-RECORD-SERVICE** | Node.js / Express / Mongoose | `5006` | Clinical consultation summaries, e-prescriptions, diagnostic test orders, and longitudinal patient health records. | `MEDICAL-RECORD-SERVICE` |
| **AI-PREDICTION-SERVICE** | Python / FastAPI / PyTorch | `5007` | Real-time clinical risk inference across Cardiology, Diabetes, Fracture X-ray, and General Health NLP triage. | `AI-PREDICTION-SERVICE` |
| **KNOWLEDGE-SERVICE** | Node.js / Express / Mongoose | `5008` | Health education content repository, clinical article publication, doctor review workflows, and patient reading guides. | `KNOWLEDGE-SERVICE` |
| **FRONTEND-CLIENT** | React 18 / Vite / Tailwind | `5173` | Modern, responsive web user interface providing custom interactive portals across all 5 user roles. | N/A |

---

## 3. Service Discovery & Eureka Registration Lifecycle

Every Node.js backend microservice and the Python FastAPI AI service integrate native, automated Eureka client registration on bootstrap:
- **Client Configuration (`eureka-client`)**: Configured with 30-second heartbeat intervals, auto-retry on connection dropouts, and deregistration on `SIGINT` / `SIGTERM` signals.
- **Python Eureka Integration (`py_eureka_client`)**: Automatically registers the FastAPI service upon application startup (`@app.on_event("startup")`), advertising endpoints to the API Gateway.
- **Fail-Safe Route Fallbacks**: The API Gateway attempts service resolution through the Eureka registry; if Eureka is unreachable during local offline testing, it falls back gracefully to statically configured localhost ports.

---

## 4. Kafka Event-Driven Messaging Architecture

MediMind employs Apache Kafka in KRaft mode (Kafka Raft Metadata Mode, eliminating ZooKeeper overhead) for asynchronous inter-service telemetry:
- **Topic: `appointment-events`**:
  - Published by: `APPOINTMENT-SERVICE` on booking creation, status change (SCHEDULED $\to$ COMPLETED $\to$ CANCELLED), and rescheduling.
  - Consumed by: Analytics engines, notification workers, and audit listeners.
- **Topic: `ai-predictions`**:
  - Published by: `AI-PREDICTION-SERVICE` and `API-GATEWAY` when clinical risk assessments are calculated.
  - Payload: Contains anonymous prediction ID, disease domain, input feature hash, risk score, calibrated probability, and operational timestamp.
- **Idempotency & Replay**: Consumers enforce idempotency via MongoDB unique transaction hashes, preventing duplicate state updates upon event replay.

---

## 5. Distributed Database Partitioning (MongoDB Atlas)

To maintain strict domain boundaries, data is segregated across dedicated logical databases within MongoDB Atlas:
1. `medimind_auth`: Accounts, credentials, user roles, active sessions, and password reset tokens.
2. `medimind_doctor`: Doctor professional profiles, qualifications, department linkages, and consultation schedules.
3. `medimind_family`: Family units, patient profiles, member metadata, and family head authorizations.
4. `medimind_hospital`: Hospital facility profiles, physical infrastructure, department directories, and bed capacities.
5. `medimind_appointment`: Complete longitudinal appointment records, status history, consultation notes, and prescriptions.

---

## 6. Key Bug Fixes & Technical Remediation Implemented

1. **Gateway Multipart/Form-Data Forwarding (`DEF-001`)**:
   - Fixed an issue where the Node.js API Gateway corrupted multi-part image uploads forwarded to FastAPI by incorrectly setting `Content-Length`. Replaced with raw stream piping preserving boundary headers.
2. **MongoDB ObjectId Resolution in AI Middleware (`DEF-002`)**:
   - Fixed HTTP 403 Forbidden on `/api/ai/fracture` caused by the middleware expecting canonical strings (`MEM-FAM-001`) while frontend sent 24-character hexadecimal ObjectIds (`6ac85a1c074c2bc731a763f6`). Added dual-mode resolution querying `medimind_family` to verify family ownership.
3. **ResNet-18 Binary Logit Sigmoid Interpretation (`DEF-003`)**:
   - Resolved the issue where the fracture baseline predicted "No Fracture" on all images. The PyTorch head outputs a single logit representing $P(\text{Fracture})$; applying softmax across a 1-element tensor had resulted in a constant 1.0/0.0 anomaly. Refactored to `torch.sigmoid(logits)` with the calibrated threshold $\tau = 0.1800$.

---

## 7. Consolidated Source Reports

This report incorporates findings from:
- `backend/BACKEND_PROGRESS.md`
- `backend/README.md`
- `Documents/Production_Readiness_Audit/MediMind_MongoDB_Service_Configuration_Report.md`
- `Documents/AI_Experiments/MediMind_Branch_Integration_Audit.md`
- `MediMind_Authentication_and_Full_Stack_Recovery_Audit.md`
