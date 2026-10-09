# MediMind — Stakeholder Demonstration Rehearsal Guide & Evidence

**Date:** October 9, 2026  
**Target Environment:** Local Development Stack (API Gateway `:5000`, Microservices `:5001–5008`, Frontend `:5173`)  
**Database:** MongoDB Community `127.0.0.1:27017` (8 Core Databases, 8,365 Documents)  
**Credential Reference:** `D:\MediMind_Backups\MediMind_Credentials_20261009.xlsx` (Strictly Outside Git)  

---

## 1. Quick Demonstration Launch

To run the live demonstration stack, execute:
```bash
node backend/scripts/start-live-demo.mjs
```
This automatically launches all 8 Node microservices, the API Gateway, the Python FastAPI AI inference service, and the React 19 / Vite frontend on `http://localhost:5173`.

---

## 2. Rehearsal Walkthrough by Role

### Act 1: Network Platform Governance (Chairman)
- **Account:** `chairman@medimind.org`
- **Rehearsal Actions:**
  1. Login via frontend portal (`http://localhost:5173/login`).
  2. Access the Platform Overview Dashboard showing system-wide hospital analytics and network bed metrics.
  3. Navigate to Hospital Management to review the onboarding request from *Nexora Advanced Surgical Center* (`HOSP-002`, `PENDING` $\to$ `ACTIVE`).
  4. Inspect Department Rosters across City Hospital and Metro General Hospital.
- **Verification Evidence:**
  - Full platform visibility with zero data leakage into private clinical records.
  - E2E Playwright verification: `e2e/01-chairman.spec.js` PASSED.

---

### Act 2: Hospital Administration & Operational Throughput (Hospital Admin)
- **Account:** `admin.city@medimind.org` (City Heart Institute, `HOSP-001`)
- **Rehearsal Actions:**
  1. Review Hospital Capacity, admissions trends, and bed occupancy gauges.
  2. Inspect clinical departments: Orthopedics, Cardiology, Neurology, Pediatrics, Diabetology.
  3. Verify cross-hospital isolation: Hospital Admin cannot view or alter departments belonging to `HOSP-002` (Nexora).
- **Verification Evidence:**
  - E2E Playwright verification: `e2e/02-hospital-admin.spec.js` PASSED.

---

### Act 3: Clinical Departmental Governance (Department Head)
- **Account:** `head.ortho.city@medimind.org` (Orthopedics Department Head)
- **Rehearsal Actions:**
  1. Access Department Overview showing assigned clinical staff.
  2. Review OPD shifts, consultation throughput, and patient queues.
  3. Verify Clinical Practice Guidelines and departmental article publishing.
  4. Verify cross-department isolation: Cannot view or edit Diabetology staff or schedules.
- **Verification Evidence:**
  - E2E Playwright verification: `e2e/03-department-head.spec.js` PASSED.

---

### Act 4: Clinical Decision Support & AI Diagnostics (Doctor)
- **Account:** `doc.rahul.sharma@medimind.org` (Senior Orthopedic Surgeon, City Hospital)
- **Rehearsal Actions:**
  1. Open clinical appointment queue; review patient consultation records for authorized family members.
  2. **Live AI Diagnostic Inference (Fracture Detection):**
     - Upload musculoskeletal radiograph (`IMG0002484.jpg`).
     - Real-time deep learning inference via ResNet-18 pipeline (`best_model.pt`).
     - Display probability (`>0.90`), risk category (`HIGH RISK`), operating threshold (`0.1800`), and Grad-CAM localized heatmap.
  3. Submit clinical consultation notes and generate electronic prescription with prescription ID and dosage schedule.
- **Verification Evidence:**
  - Full server-side authorization check (`RecordAccess` validation).
  - E2E Playwright verification: `e2e/04-doctor.spec.js` & `e2e/06-ai-predictions.spec.js` PASSED.

---

### Act 5: Family Health & Preventive Screening (Family Account)
- **Account:** `rohan.kapoor@medimind.example` (`FAM-ACC-001`, Rohan Kapoor Household)
- **Rehearsal Actions:**
  1. Access household portal; view dependents (Rohan, Priya, Aarav, Sunita Kapoor).
  2. Switch between family member profiles and inspect isolated health records.
  3. **Patient-Facing AI Screening:**
     - Run 3-Year Diabetes Risk Forecaster with metabolic parameters (BMI, Glucose, Age).
     - Run Cardiovascular 10-Year Risk Assessment with blood pressure and lipid profile.
     - Execute General Health NLP Symptom Checker with natural language input (*"Severe throat pain and mild headache for 2 days, no fever"*).
     - Inspect advisory clinical decision-support disclaimers.
  4. Book a clinical consultation with Dr. Rahul Sharma.
- **Verification Evidence:**
  - Cross-family boundary privacy: Cannot view or manipulate FAM-002 (Ravi Sharma) records.
  - E2E Playwright verification: `e2e/05-family.spec.js` & `e2e/07-cross-account-session.spec.js` PASSED.

---

## 3. Rehearsal Verdict & Certification
All 5 stakeholder demonstration personas and clinical interaction workflows were executed cleanly with 100% functional reliability, zero console crashes, and zero authorization leaks. The demonstration flow is certified presentation-ready.
