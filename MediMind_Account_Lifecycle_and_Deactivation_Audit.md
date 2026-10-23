# MediMind — Account Lifecycle, Deactivation Architecture & Boundary Audit

**Date:** 2026-10-23  
**Target Branch:** `experiment8-multiview-localized-fusion`  
**Components:** `PlatformAnalyticsView.jsx`, `chairmanService.js`, `test_staging_account_deactivation.py`

---

## 1. Platform Account Classification & Canonical Lifecycle

MediMind enforces role-based identity management across 5 account categories:
1. **Doctors (`DOCTOR`):** 68 Total (66 Active, 2 Deactivated — Dr. Rahul Mehta & Dr. Vikram Anand).
2. **Department Heads (`DEPARTMENT_HEAD`):** 14 Total (all 14 active, managing clinical units across the 3 operational hospitals).
3. **Hospital Administrators (`HOSPITAL_ADMIN`):** 4 Total (credentialed facility administrators).
4. **Registered Families (`FAMILY`):** 10 Household Accounts (representing 29 registered family members).
5. **Platform Owners (`CHAIRMAN`):** 2 Executive Platform Governance Accounts (`chairman@medimind.org` & `chairman@medimind.com`).

**Total Canonical Active Accounts:** $66 + 14 + 4 + 10 + 2 = \mathbf{96}$ active accounts.

---

## 2. Identified Deficiencies & Remediations

### 2.1 Department Heads Omitted from Platform User Directory
- **Defect:** In `frontend/src/components/chairman/views/PlatformAnalyticsView.jsx`, the user roster loop populated Doctors, Admins, Families, and Owners, but **completely omitted Department Heads**. Furthermore, the Role Filter dropdown had no option for Department Heads.
- **Remediation:** 
  - Added `chairmanService.getDepartmentHeads()` into the view's data loading promise.
  - Mapped all Department Heads into the unified roster with facility, specialty, and authentication status.
  - Added `<option value="Department Head">Department Heads</option>` to the role filter dropdown.

### 2.2 Hardcoded & Incomplete Deactivation Aggregations
- **Defect:** In `chairmanService.js`, `totalDeactivatedAccounts` was calculated strictly from `inactiveDocs.length`, ignoring potential deactivations across Hospital Admins, Department Heads, and Family accounts.
- **Remediation:** Updated `getPlatformSummary` to dynamically compute `dynamicTotalDeactivated` as:
  ```javascript
  const dynamicTotalDeactivated = 
    inactiveDocs.length + 
    inactiveAdmins.length + 
    inactiveHeads.length + 
    inactiveFamilies.length;
  ```
  Exposed `deactivatedBreakdown` object covering all roles for complete transparency.

### 2.3 Unified Authentication Status
- **Defect:** Family accounts previously hardcoded `authStatus: 'Authorized'` regardless of account status.
- **Remediation:** Mapped all account types to `isDeact ? 'Login Denied (HTTP 403)' : 'Authorized'`. In the backend `authService.js`, inactive accounts receive `HTTP 403 Forbidden: Account is inactive or suspended`.

---

## 3. Strict Staging Boundary Policy & Production Database Protection

### Explicit Directive Adherence:
Section 6 of the project specification dictates:
> *"Do not create synthetic accounts in the live operational database solely to make the dashboard look more realistic. If the only available target is the live operational Atlas database, stop before inserting these records and report that staging data or explicit operational authorization is needed."*

### Execution Safeguard:
1. **Live Production MongoDB Atlas (`cluster0.plxllln.mongodb.net`):** Strictly protected. ZERO fake synthetic deactivated accounts were inserted into the live cluster.
2. **Authorized Local Staging Environment (`localhost:27017`):** Created and executed an automated verification harness [`scripts/test_staging_account_deactivation.py`](file:///d:/projects/MediMind/scripts/test_staging_account_deactivation.py).

### Staging Verification Evidence:
```text
=== VERIFYING SYNTHETIC DEACTIVATED ACCOUNTS IN STAGING (localhost:27017) ===
Inserted 4 synthetic inactive accounts into staging DB (medimind_staging_auth).
  [PASS] Role: DOCTOR           -> Status: INACTIVE -> HTTP 403 (Account is inactive or suspended)
  [PASS] Role: HOSPITAL_ADMIN   -> Status: INACTIVE -> HTTP 403 (Account is inactive or suspended)
  [PASS] Role: DEPARTMENT_HEAD  -> Status: INACTIVE -> HTTP 403 (Account is inactive or suspended)
  [PASS] Role: FAMILY           -> Status: INACTIVE -> HTTP 403 (Account is inactive or suspended)
Cleaned up 4 staging records. Staging DB left pristine.

[STAGING ACCOUNT LIFECYCLE & DEACTIVATION BOUNDARY VERIFIED 100% SUCCESS]
```
All staging records were automatically purged post-test, leaving the staging database pristine.
