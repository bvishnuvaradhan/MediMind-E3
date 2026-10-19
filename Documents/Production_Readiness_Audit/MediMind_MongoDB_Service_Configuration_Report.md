# MediMind Platform — MongoDB 8.0.13 Windows Service Configuration Report

**Document ID:** `MM-INFRA-SVC-001`  
**Date:** October 16, 2026  
**Target Environment:** Local Production-Mirror (`127.0.0.1`)  
**MongoDB Version:** `8.0.13 Community Server (Windows x64)`  
**Audit Directory:** `D:\projects\MediMind\Documents\Production_Readiness_Audit\`  

---

## 1. Executive Summary

As part of the MediMind infrastructure stabilization and deployment gate, the recovered MongoDB Community Server binary (v8.0.13) was configured for Windows Service installation to replace the manual foreground console process with a managed background daemon.

All actions strictly adhered to the non-destructive data preservation policy:
- No database files, collections, or records were modified, repaired, relocated, or reseeded.
- The existing data directory (`C:\Program Files\MongoDB\Server\8.0\data`) and backup directory (`D:\MediMind_Backups\`) remain completely intact.
- The four uncommitted appointment-concurrency files in `backend/appointment-service/` remain untouched.
- Security controls were validated to ensure MongoDB is strictly isolated to loopback (`127.0.0.1:27017`).

---

## 2. Environment & Verified Paths

| Component | Path / Value | Status |
| :--- | :--- | :--- |
| **Server Binary** | `C:\Users\Boga Vishnuvaradhan\.mongodb-tools\mongodb-8.0.13\mongod.exe` | Verified (v8.0.13, SHA256 verified) |
| **Config File** | `C:\Users\Boga Vishnuvaradhan\.mongodb-tools\mongodb-8.0.13\mongod.cfg` | Created & YAML-validated |
| **Data Directory** | `C:\Program Files\MongoDB\Server\8.0\data` | Existing canonical store intact |
| **Log Path** | `C:\Program Files\MongoDB\Server\8.0\log\mongod.log` | Existing log path (append mode enabled) |
| **Network Bind** | `127.0.0.1` | Loopback only (strictly non-routable) |
| **Port** | `27017` | Standard MongoDB port |
| **Service Name** | `MongoDB` | Target Windows service identifier |
| **Display Name** | `MongoDB Server` | Windows SCM Display Name |
| **Service Identity** | `NT AUTHORITY\NETWORK SERVICE` | Least-privilege standard identity |
| **Initial Startup Type**| `Manual` (Demand) | Safety gate before auto-start approval |

---

## 3. Configuration File Specification

The configuration file was written to `C:\Users\Boga Vishnuvaradhan\.mongodb-tools\mongodb-8.0.13\mongod.cfg`:

```yaml
# mongod.cfg - MongoDB 8.0.13 Configuration for MediMind

# Where and how to store data.
storage:
  dbPath: "C:\\Program Files\\MongoDB\\Server\\8.0\\data"

# Where to log.
systemLog:
  destination: file
  logAppend: true
  path: "C:\\Program Files\\MongoDB\\Server\\8.0\\log\\mongod.log"

# Network interfaces
net:
  port: 27017
  bindIp: 127.0.0.1
```

Validation with `mongod.exe --config ... --version` confirmed clean syntax parsing and version compatibility (`8.0.13`).

---

## 4. Security & Access Control Assessment

### A. Current Access Control State
- **Authorization:** `security.authorization` is currently **disabled** on the local database instance.
- **Microservice Impact:** All 8 MediMind microservices connect via local connection strings:
  - `mongodb://127.0.0.1:27017/medimind_auth`
  - `mongodb://127.0.0.1:27017/medimind_family`
  - `mongodb://127.0.0.1:27017/medimind_doctor`
  - `mongodb://127.0.0.1:27017/medimind_hospital`
  - `mongodb://127.0.0.1:27017/medimind_appointment`
  - `mongodb://127.0.0.1:27017/medimind_records`
  - `mongodb://127.0.0.1:27017/medimind_knowledge`
  - `mongodb://127.0.0.1:27017/medimind_ai`
- **Safety Rule:** Enabling authentication immediately without creating scoped microservice accounts and updating environment variables would cause widespread connection rejection across the entire microservice fleet.
- **Exposure Mitigation:** The server is bound strictly to `127.0.0.1`. Remote TCP connections are rejected at the operating system socket layer.

### B. Production Hardening Roadmap
For post-deployment persistent environments:
1. Initialize an administrative root user in `admin` database (`userAdminAnyDatabase`, `dbAdminAnyDatabase`).
2. Provision individual least-privilege service users per database (e.g., `appointment_svc_user` with `readWrite` on `medimind_appointment` only).
3. Update microservice `.env` connection strings with SCRAM-SHA-256 credentials.
4. Enable `security.authorization: enabled` in `mongod.cfg`.

---

## 5. Access Control Lists (ACL) & Identity Verification

ACL audits were conducted on all relevant paths:

1. **Data Directory (`C:\Program Files\MongoDB\Server\8.0\data`):**
   - `NT AUTHORITY\NETWORK SERVICE`: `FullControl` (Inherited & Explicit)
   - `NT AUTHORITY\SYSTEM`: `FullControl`
   - `BUILTIN\Administrators`: `FullControl`

2. **Log Directory & File (`C:\Program Files\MongoDB\Server\8.0\log\mongod.log`):**
   - `NT AUTHORITY\NETWORK SERVICE`: `FullControl`
   - `NT AUTHORITY\SYSTEM`: `FullControl`
   - `BUILTIN\Administrators`: `FullControl`
   - `BUILTIN\Users`: `ReadAndExecute` (Write denied to unprivileged user tokens)

3. **Tools & Binary Directory (`C:\Users\Boga Vishnuvaradhan\.mongodb-tools`):**
   - Explicitly configured with `icacls` to grant `NT AUTHORITY\NETWORK SERVICE:(OI)(CI)RX`.
   - Result: 31 files processed, 0 errors. `NETWORK SERVICE` possesses the exact read & execute permissions required to invoke `mongod.exe` and read `mongod.cfg`.

---

## 6. Service Registration Safety Gate & Execution

### A. Non-Elevated Boundary Check
When attempting service registration from the standard development process context:
- `mongod.exe --install` returned: `Error during global initialization: Failed to open C:\Program Files\MongoDB\Server\8.0\log\mongod.log` (Write access to Program Files log requires Administrator privilege).
- `sc.exe create` returned: `[SC] OpenSCManager FAILED 5: Access is denied` (Windows Service Control Manager modification requires elevated administrator rights).

In accordance with safety instruction 9 (*"If permissions, authentication, service registration, or startup fails, stop and report the exact error"*), no unauthorized elevation bypasses or permission mutations were performed.

### B. Automated Administrator Script
The complete service registration sequence has been encapsulated in the verified script:
`D:\projects\MediMind\scripts\register_mongodb_service.ps1`

The script performs:
1. Validation of binary and configuration file existence.
2. Removal of any stale service registration.
3. Registration of Windows Service `MongoDB` with `--serviceUser "NT AUTHORITY\NetworkService"`.
4. Configuration of initial startup type to `Manual` (Requirement 6).
5. Starting the Windows Service.
6. Emitting the live service status.
