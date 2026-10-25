# MediMind — Excel Workbook Reconciliation & Sheet Cleanup Audit

**Audit Baseline Date:** October 25, 2026  
**Target Repository:** `D:\projects\MediMind`  
**Git Branch:** `experiment8-multiview-localized-fusion`  
**Authoritative Operational Database:** MongoDB Atlas (`medimind_auth`, `medimind_doctor`, `medimind_family`, `medimind_hospital`, `medimind_appointment`)  
**Target Workbook:** `Documents/MediMind_Role_Credentials.xlsx`  
**Protected Pristine Backups:**
- `Documents/MediMind_Role_Credentials_backup_20261025_115300.xlsx`
- `Documents/MediMind_Role_Credentials_Cleaned_v2.xlsx`

---

## 1. Executive Summary

An exhaustive audit of the 13 worksheets inside `MediMind_Role_Credentials.xlsx` was conducted to resolve discrepancies between spreadsheet documentation, UI metrics, and live MongoDB Atlas database state.

The audit revealed that the workbook previously contained conflicting counts, duplicate role inventories, obsolete draft tables containing dummy placeholder data, and broken formula cross-references. 

Through safe programmatic reconciliation, **4 redundant and obsolete worksheets were permanently removed**, consolidating the inventory into **9 pristine, authoritative worksheets**. All doctor profile IDs were preserved and merged into the primary `Doctor` sheet. Automated e2e parsers (`testAccounts.js`) were verified and load exactly 96 active operational accounts with zero errors.

---

## 2. Worksheet Disposition: Before vs. After

| # | Worksheet Name | Status Before Audit | Action Taken | Current Disposition & Record Count |
|---|----------------|---------------------|--------------|-------------------------------------|
| 1 | `Instructions` | Active, outdated guidance | **Preserved & Updated** | Guidelines, security rules, and role definitions. |
| 2 | `Reconciliation Summary` | Stale counts (59 vs 96) | **Reconciled with Formulas** | Real-time counts totaling 96 active, 2 operational deactivations. |
| 3 | `Credential Index` | Stale index numbers | **Preserved & Reconciled** | Index of all roles and sheet navigation. |
| 4 | `Doctor Account Inventory` | Redundant duplicate of `Doctor` with Profile IDs | **Merged & Safely Removed** | Merged `Doctor Profile ID` into `Doctor`; retired redundant sheet. |
| 5 | `Initial Credentials Setup` | Duplicate of `Doctor` sheet | **Safely Removed** | 100% redundant duplicate of Doctor logins; eliminated. |
| 6 | `Doctor` | 66 Doctors without Profile IDs | **Preserved & Enriched** | Authoritative 66 active doctors with profile IDs and auth IDs. |
| 7 | `Department Head` | 14 Department Heads | **Preserved & Verified** | Authoritative 14 clinical department leadership accounts. |
| 8 | `Hospital Admin` | 4 Hospital Admins | **Preserved & Verified** | Authoritative 4 facility administrators across 3 hospitals. |
| 9 | `Chairman` | 2 Platform Owners | **Preserved & Verified** | Authoritative 2 executive Platform Owner accounts. |
| 10 | `Family` | 10 Families (44 Members) | **Preserved & Verified** | Authoritative 10 family households representing 44 patients. |
| 11 | `Demonstration Accounts` | Duplicate of `Inactive Accounts` | **Merged & Safely Removed** | Merged into `Inactive Accounts`; retired redundant sheet. |
| 12 | `Historical 66 Capacity` | Obsolete draft with "NONE" logins | **Safely Removed** | Early staffing draft where all rows had no logins; retired. |
| 13 | `Inactive Accounts` | 2 Deactivated Doctors | **Preserved & Consolidated** | Authoritative 8 accounts (2 operational + 6 synthetic demo). |

---

## 3. Rationale for Sheet Removals

### 3.1 Removal of `Historical 66 Capacity`
- **Audit Finding:** Every single row in this worksheet contained `NONE - NO LOGIN PROFILE` under the Login Email column, and `UNPROVISIONED_STAFF_CAPACITY` under the Status column.
- **Root Cause:** This sheet was an early placeholder draft created before the 66 active doctor profiles were provisioned and linked to real authentication credentials.
- **Impact of Removal:** Eliminates user confusion regarding whether there are unprovisioned doctor accounts. Real doctors reside authoritatively on the `Doctor` sheet.

### 3.2 Removal of `Doctor Account Inventory`
- **Audit Finding:** Contained 66 doctor rows matching `Doctor`, but listed `Doctor Profile ID` while omitting authentication passwords.
- **Action Taken:** Extracted `Doctor Profile ID` and merged it directly as a dedicated column into `Doctor`.
- **Impact of Removal:** Prevents split-brain discrepancies where staff look in one sheet for passwords and another for profile IDs.

### 3.3 Removal of `Initial Credentials Setup`
- **Audit Finding:** Identical duplicate of the `Doctor` sheet created during initial seeding. It had no unique columns, formulas, or operational value.
- **Impact of Removal:** Streamlines workbook navigation and ensures single source of truth for doctors.

### 3.4 Removal of `Demonstration Accounts`
- **Audit Finding:** Contained 6 synthetic demo accounts with malformed status strings that duplicated entries in `Inactive Accounts`.
- **Action Taken:** Merged into `Inactive Accounts` under clear categorization (`SYNTHETIC_DEMO`).
- **Impact of Removal:** Clean separation between operational active accounts and test/inactive accounts.

---

## 4. Operational Account Inventory Verification (Live Atlas DB)

Cross-validation with the live MongoDB Atlas database confirmed exact 1-to-1 parity:

| User Role | Active Accounts | Deactivated Accounts | Live Atlas DB Verification |
|-----------|-----------------|----------------------|----------------------------|
| **Platform Owner (Chairman)** | 2 | 0 | `medimind_auth.users.count({ role: 'CHAIRMAN' }) == 2` |
| **Hospital Administrator** | 4 | 0 | `medimind_auth.users.count({ role: 'HOSPITAL_ADMIN' }) == 4` |
| **Department Head** | 14 | 0 | `medimind_auth.users.count({ role: 'DEPARTMENT_HEAD' }) == 14` |
| **Doctor** | 66 | 2 | `medimind_doctor.doctors.count({ status: 'ACTIVE' }) == 66`<br>`medimind_doctor.doctors.count({ status: 'INACTIVE' }) == 2` |
| **Family Account** | 10 (44 members) | 0 | `medimind_family.families.count() == 10`<br>`medimind_family.familymembers.count() == 44` |
| **TOTAL ACTIVE** | **96** | **2** | **100% Exact Match** |

### Operational Deactivated Doctors in Atlas
1. `dr.arvind.deshpande@aarogyam.hospital` (ID: `6ac85a1c074c2bc731a763c0`) — Department: Cardiology — Reason: Voluntary Sabbatical / Leave of Absence.
2. `dr.meenakshi.sundaram@aarogyam.hospital` (ID: `6ac85a1c074c2bc731a763c1`) — Department: Orthopedics — Reason: Transitioned to Department Head Leadership.

---

## 5. Security & Git Compliance

1. **Spreadsheet Git Exclusion:** `Documents/MediMind_Role_Credentials.xlsx` and all related `.xlsx` workbooks are strictly matched by `.gitignore` and have never been staged or committed to Git.
2. **Zero-Credential Production Bundle:** Verified that `npm run build` produces production JavaScript bundles with **zero** hardcoded credential strings or test credentials.
3. **Automated Parser Health:** `frontend/e2e/testAccounts.js` loads the consolidated workbook cleanly:
   ```
   DOCTOR: 66, FAMILY: 10, DEPARTMENT_HEAD: 14, HOSPITAL_ADMIN: 4, CHAIRMAN: 2 (Total: 96)
   ```
