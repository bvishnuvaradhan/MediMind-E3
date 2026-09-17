# 👨‍👩‍👧 ROLE 1 — FAMILY ACCOUNT

## 1. Basic Concept

A **Family Account** is the main account created by **one family member**.

It works similarly to Netflix/Hotstar:

```text
                    FAMILY ACCOUNT
                         │
                  Account Creator
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       Father         Mother           Son
          ↓              ↓              ↓
       Records        Records        Records
       AI Results     AI Results     AI Results
       Appointments   Appointments   Appointments
       Consultations  Consultations  Consultations
       Prescriptions  Prescriptions  Prescriptions
```

The important difference is that these are **medical profiles**, not entertainment profiles.

The family account represents the **account/login identity**, while every family member represents an individual **patient identity**.

```text
Family Account
     │
     ├── Login credentials
     │
     └── Family Members
           ├── Member A → Patient
           ├── Member B → Patient
           ├── Member C → Patient
           └── Member D → Patient
```

---

# 2. Account Creation

Only the family member creating the account performs registration.

### Registration page

The creator enters:

* Family name
* Creator's name
* Email
* Mobile number
* Password
* Confirm password

For now:

> **Normal email/password login only.**

No OTP, Google login, or other authentication methods initially.

### After registration

The creator becomes:

> **Family Account Creator**

Then they can create the other family-member profiles.

---

# 3. Login

There is **one login for the entire family account**.

```text
Email
Password
   ↓
Login
   ↓
Family Account
   ↓
Select Profile
   ↓
Member Dashboard
```

Example:

```text
Who's using MediMind?

┌──────────────┐
│ 👨 Father    │
├──────────────┤
│ 👩 Mother    │
├──────────────┤
│ 👦 Son       │
├──────────────┤
│ 👧 Daughter  │
└──────────────┘
```

The same account can be logged in from **multiple devices simultaneously**.

For example:

```text
Laptop       → Father
Mobile       → Mother
Tablet       → Son
Another PC   → Daughter
```

All are using the same Family Account.

---

# 4. Family Members

The creator can create individual profiles.

Each profile can contain:

* Full name
* Profile picture
* Date of birth
* Gender
* Blood group
* Phone number
* Email
* Address
* Emergency contact
* Basic health information
* Medical conditions
* Allergies
* Previous treatments
* Other relevant health information

The exact database fields will be finalized during database design.

---

# 5. Member Management

### Creator can:

* Add member
* Edit member
* View member
* Remove member
* Switch between profiles
* Manage the family account
* Deactivate the family account
* Delete the family account

### Other family members can:

* View members
* Switch between profiles
* Access other members' information
* Access other members' medical records
* Access other members' appointments
* Access other members' AI predictions
* Access other members' consultations
* Access other members' prescriptions

Because we've decided:

> **Anyone inside the family account can access anyone else's information and medical records.**

Therefore, there is **no internal privacy separation between family profiles** in the current version.

---

# 6. Important Permissions

Only the **account creator** has administrative control over the family account.

```text
Family Account Creator
        │
        ├── Add Member          ✅
        ├── Edit Member         ✅
        ├── View Member         ✅
        ├── Remove Member       ✅
        ├── Manage Account      ✅
        ├── Deactivate Account  ✅
        └── Delete Account      ✅


Other Family Member
        │
        ├── View Members        ✅
        ├── View Records        ✅
        ├── View AI Results     ✅
        ├── View Appointments   ✅
        ├── View Consultations  ✅
        ├── View Prescriptions  ✅
        └── Remove Member       ❌
```

---

# 7. Family Dashboard

After selecting a profile, the family member enters the dashboard.

### Dashboard contains:

**Welcome section**

> Welcome back, Father 👋

### Quick information

* Upcoming appointment
* Recent medical record
* Latest AI prediction
* Recent consultation
* Recent prescription
* Shared doctors
* Latest AI prediction

Example:

```text
┌──────────────────────────────────────────┐
│ Welcome back, Father 👋                  │
│                                          │
│ Upcoming Appointment                     │
│ Dr. Rahul • Orthopedics • 10:30 AM       │
│                                          │
├──────────────┬──────────────┬────────────┤
│ 🩺 Records   │ 🤖 AI Result │ 📅 Appts   │
│     12       │      3       │     2      │
└──────────────┴──────────────┴────────────┘
```

---

# 8. Family Members Page

This page manages and displays all family profiles.

```text
Family Members

┌─────────────────┐
│ 👨 Father       │
│ 12 Records      │
│ 3 Predictions   │
│ 2 Appointments  │
└─────────────────┘

┌─────────────────┐
│ 👩 Mother       │
│ 8 Records       │
│ 2 Predictions   │
│ 1 Appointment   │
└─────────────────┘

        + Add Member
```

Selecting a member opens their profile.

---

# 9. Member Profile Page

Each member has their own health profile.

### Sections

### Personal Information

* Name
* Age
* Gender
* Blood group
* Contact information
* Address
* Emergency contact

### Health Summary

* Medical conditions
* Allergies
* Previous treatments
* Important health information

### Activity

* Medical records
* AI predictions
* Appointments
* Consultations
* Prescriptions
* Shared doctors

---

# 10. 🗂️ Unified Medical Records Page

This is one of the **main MediMind features**.

Instead of forcing the family to navigate separate pages for every medical document, MediMind provides:

> **Unified Medical Records**

Example:

```text
Unified Medical Records

Filter:
[All] [Reports] [Tests] [X-Rays] [Prescriptions]
[Consultations] [AI Reports]

──────────────────────────────

🩸 Blood Test
15 Sep 2026
Uploaded by Family

──────────────────────────────

🦴 X-Ray
10 Sep 2026
Orthopedics

──────────────────────────────

📋 Consultation
08 Sep 2026
Dr. Kumar

──────────────────────────────

💊 Prescription
05 Sep 2026
Dr. Kumar

──────────────────────────────

❤️ ECG Report
01 Sep 2026
Cardiology

──────────────────────────────

🤖 Heart Disease Prediction
01 Sep 2026
AI Prediction Service
```

This page can show:

* Family-uploaded records
* Doctor consultation records
* Prescriptions
* Test results
* Laboratory reports
* Scans
* X-rays
* AI prediction reports
* Other relevant medical documents

The selected family member's complete medical history can be viewed from this page.

---

# 11. 📤 Upload Medical Record

Family members can upload their own medical records.

### Supported records

* PDF reports
* Images
* X-rays
* Scan images
* Prescriptions
* Test results
* Medical documents

### Upload flow

```text
Select Member
      ↓
Record Type
      ↓
Upload File
      ↓
Add Description
      ↓
Record Date
      ↓
Save
```

Example:

```text
Member: Father
Type: X-Ray
Date: 15-09-2026
File: arm_xray.jpg
Description: Left arm pain after fall
```

### Family-uploaded records

The family can:

* Upload
* View
* Edit metadata
* Delete its own uploaded records

Doctor-created clinical records follow different rules.

---

# 12. 🤖 AI Prediction Page

Every family member gets access to the AI prediction module.

The page provides three AI modules:

```text
AI Health Prediction

┌─────────────────────────┐
│ 🦴 Fracture Detection   │
│ Upload X-Ray            │
└─────────────────────────┘

┌─────────────────────────┐
│ 🩺 Diabetes Risk        │
│ Enter health details    │
└─────────────────────────┘

┌─────────────────────────┐
│ ❤️ Heart Disease Risk   │
│ Enter health details    │
└─────────────────────────┘
```

The AI system is designed as **decision support**, not autonomous diagnosis.

---

# 13. 🦴 Fracture Detection

Family selects:

> **Fracture Detection**

Then:

```text
Upload X-Ray
      ↓
AI / CNN Model
      ↓
Prediction
      ↓
Confidence
      ↓
Explanation
      ↓
Save Result
```

Example:

```text
AI Prediction

Possible Fracture

Confidence: 92%

[View Explanation]

⚠️ AI-assisted prediction.
Consult a qualified doctor for clinical assessment.
```

The prediction is saved to that member's **AI Prediction History**.

The system may also provide an explainability visualization such as **Grad-CAM** for the doctor.

---

# 14. 🩺 Diabetes Risk Prediction

The family member enters the required health parameters.

For example:

* Age
* Glucose
* BMI
* Blood pressure
* Other required parameters

Then:

```text
Health Parameters
       ↓
AI Model
       ↓
Prediction
       ↓
Risk Score
       ↓
Result
```

Example:

```text
Diabetes Risk

Risk Level: Moderate

Risk Score: XX%

[View Details]

⚠️ AI-assisted result — not a medical diagnosis.
```

The prediction is stored in the member's prediction history.

---

# 15. ❤️ Heart Disease Risk Prediction

Similarly:

```text
Health Parameters
       ↓
AI Model
       ↓
Prediction
       ↓
Risk Score
       ↓
Result
```

Example:

```text
Heart Disease Risk

Risk Level: Low

Risk Score: XX%

[View Details]

⚠️ AI-assisted result — not a medical diagnosis.
```

The result is stored in the member's prediction history.

---

# 16. 🤖 AI Prediction History

Each family member has their own prediction history.

```text
AI Prediction History — Father

🦴 Fracture Detection
15 Sep 2026
Result: Possible Fracture

❤️ Heart Disease Risk
10 Sep 2026
Result: Low Risk

🩺 Diabetes Risk
05 Sep 2026
Result: Moderate Risk
```

Each prediction can contain:

* Prediction type
* Date/time
* Input information
* Result
* Risk/confidence score
* AI model/version
* Explanation
* Related medical record, where applicable

---

# 17. 👨‍⚕️ Doctors Page

The family can browse available doctors.

Initially there are three departments:

```text
🦴 Orthopedics
🩺 Diabetology
❤️ Cardiology
```

Doctor cards can display:

* Doctor name
* Profile picture
* Specialization
* Department
* Hospital
* Experience
* Availability
* Professional information
* Published knowledge/articles

The purpose is not only appointment booking.

The family can use doctor profiles and published knowledge to **build trust and decide which doctor to consult**.

---

# 18. 📅 Appointments

Family members can book appointments for a **specific family profile**.

### Flow

```text
Select Member
      ↓
Select Department
      ↓
Select Doctor
      ↓
Select Date
      ↓
Select Time Slot
      ↓
Book Appointment
      ↓
Confirmation
```

Example:

```text
Appointment

Patient: Mother
Doctor: Dr. Rahul
Department: Orthopedics
Hospital: MediMind Hospital
Date: 18 Sep 2026
Time: 10:30 AM
Status: Confirmed
```

The family can:

* Book appointment
* View appointment
* Reschedule appointment
* Cancel appointment
* View appointment history

---

# 19. 📋 Consultations

After an appointment, the doctor can create a consultation for the selected patient.

The family can view:

* Doctor
* Date
* Symptoms
* Observations
* Clinical assessment
* Treatment plan
* Consultation notes
* Related medical records
* AI prediction reviewed by doctor
* Prescription

Example:

```text
Consultation

Patient: Mother
Doctor: Dr. Rahul
Date: 18 Sep 2026

Symptoms:
Knee pain

Observations:
...

Clinical Assessment:
...

Treatment Plan:
...

Prescription:
View Prescription
```

### Important clinical-record rule

Once a consultation is **finalized/submitted**, the original consultation is:

> **Immutable**

It should not simply be edited or deleted.

If a correction is required:

```text
Original Consultation
        ↓
Immutable
        ↓
Amendment / Correction
        ↓
New linked record
```

This preserves medical-history integrity.

---

# 20. 💊 Prescriptions

A family member can view prescriptions issued by doctors.

Example:

```text
Prescription

Patient: Father
Doctor: Dr. Kumar
Date: 15 Sep 2026

Medicine 1
Dosage: ...

Medicine 2
Dosage: ...

Instructions:
...
```

### Prescription rule

Once a prescription is finalized:

> **The original prescription is immutable.**

If a correction is necessary:

```text
Original Prescription
        ↓
Immutable
        ↓
New / Corrected Prescription
        ↓
Linked to Original
```

This maintains a reliable clinical history.

---

# 21. 🔐 Doctor Access / Sharing

This is one of the **most important MediMind features**.

The family controls which doctor receives access to a patient's medical information.

The family selects:

```text
Specific Family Member
        ↓
Specific Doctor
        ↓
Grant Access
```

Example:

```text
Share Medical Records

Patient:
👩 Mother

Doctor:
Dr. Rahul
Orthopedics

Access:

☑ Everything for this patient

       [Grant Access]
```

### Important change from the earlier design

We are **not** using individual checkboxes such as:

```text
☑ Medical Records
☑ Previous Tests
☑ X-Rays
☑ Prescriptions
☑ AI Predictions
☑ Consultation History
```

Instead, MediMind uses:

> **Share Everything**

for the selected family member.

Therefore, once access is granted, the doctor receives access to the complete authorized medical history of that specific patient.

---

# 22. Doctor Access Rules

Suppose:

```text
Family
 ├── Father
 ├── Mother
 └── Son
```

The family grants:

```text
Mother → Dr. Rahul
```

Then:

```text
Dr. Rahul
    ↓
Mother's complete authorized records
```

Dr. Rahul **cannot automatically access**:

```text
Father ❌
Son ❌
Other family members ❌
```

If the family wants Dr. Rahul to access Father's records, they must separately authorize:

```text
Father → Dr. Rahul
```

Therefore:

> **Doctor authorization is patient-specific, not family-wide.**

---

# 23. 👨‍⚕️ Shared Doctors / Doctor Access Page

The family can see which doctors currently have access to each member.

Example:

```text
Doctor Access

┌───────────────────────────────┐
│ Dr. Rahul                     │
│ Orthopedics                   │
│ Patient: Mother               │
│ Access: Active                │
│                               │
│             [Revoke Access]   │
└───────────────────────────────┘

┌───────────────────────────────┐
│ Dr. Priya                     │
│ Cardiology                    │
│ Patient: Father               │
│ Access: Active                │
│                               │
│             [Revoke Access]   │
└───────────────────────────────┘
```

The family can:

* View authorized doctors
* See which member is shared
* View access status
* Revoke access

### Revoke flow

```text
Family
  ↓
Select Member
  ↓
Select Doctor
  ↓
Revoke Access
  ↓
Doctor loses access
```

There is **no family-side personal “who accessed my records” history page** in the current version.

---

# 24. 📚 MediMind Knowledge

MediMind Knowledge is **separate from private medical records**.

There are two fundamentally different types of information:

```text
Medical Records
       ↓
Patient-specific private information
```

and

```text
MediMind Knowledge
       ↓
Doctor-authored medical knowledge
       ↓
General/public healthcare information
```

Doctors can create knowledge articles based on:

* Medical experience
* Healthcare knowledge
* General clinical insights
* Educational information
* Research/learning
* Best practices

However:

> **Private patient information must never be exposed in a knowledge article without proper authorization and anonymization.**

---

# 25. 📖 Public Medical Knowledge

Published knowledge articles can be made publicly readable.

Therefore:

```text
Public User
     ↓
MediMind Knowledge
     ↓
Published Articles
```

Family users can also read these articles.

This allows families to:

* Learn about healthcare topics
* Understand medical conditions
* Learn about prevention
* Understand available departments
* Learn about doctors' areas of expertise
* Build trust before booking appointments

---

# 26. 👨‍⚕️ Doctor Knowledge Workflow

Doctors can create articles, but publication requires review.

```text
Doctor Creates Article
        ↓
Draft
        ↓
Department Head Review
        ↓
Approval
        ↓
Publish
        ↓
Public / Family / Medical Staff
```

A Department Head can:

* Review article
* Approve article
* Reject/request changes
* Publish approved article

Doctors can:

* Create drafts
* Edit their drafts
* Submit for review
* View their articles
* Read published articles

---


The family account can receive:

### Appointment notifications

* Appointment confirmation
* Appointment reminder
* Appointment reschedule
* Appointment cancellation

### Medical notifications

* Consultation available
* Prescription available
* AI prediction completed
* Medical record uploaded

### Access notifications

* Doctor access granted
* Doctor access revoked

### System notifications

* Account-related notifications
* Important platform updates

---

# 28. ⚙️ Family Settings

Settings can contain:

### Account

* Family name
* Email
* Mobile number
* Password

### Members

* Manage profiles
* Add members
* Edit members
* Remove members — **creator only**

### Account Management

* Deactivate family account — **creator only**
* Delete family account — **creator only**

### Security

* Change password
* Active sessions/devices
* Logout

### Preferences

* Theme

---

# 29. Family Account Deactivation

The account creator can deactivate the entire family account.

```text
Creator
   ↓
Settings
   ↓
Deactivate Family Account
   ↓
Confirmation
   ↓
Family Account Deactivated
```

When deactivated:

* Family login is disabled.
* Family members cannot use the account normally.
* Historical data can be retained according to system rules.

---

# 30. Family Account Deletion

The creator can also request/delete the entire family account.

```text
Creator
   ↓
Settings
   ↓
Delete Family Account
   ↓
Confirmation
   ↓
Account Deletion Process
```

Deletion should be handled carefully because the account may contain:

* Medical records
* AI predictions
* Appointments
* Consultations
* Prescriptions
* Doctor access relationships

Therefore, the implementation should distinguish between **account deactivation** and **permanent deletion**.

---

# 31. Family Permissions Summary

| Action                        | Creator |       Other Family Members      |
| ----------------------------- | :-----: | :-----------------------------: |
| Login                         |    ✅    |                ✅                |
| Select profile                |    ✅    |                ✅                |
| View family members           |    ✅    |                ✅                |
| Add member                    |    ✅    |                ❌                |
| Edit member                   |    ✅    | ❌ / according to implementation |
| Remove member                 |    ✅    |                ❌                |
| View another member's profile |    ✅    |                ✅                |
| View another member's records |    ✅    |                ✅                |
| Upload medical record         |    ✅    |                ✅                |
| Edit own uploaded records     |    ✅    |                ✅                |
| Delete own uploaded records   |    ✅    |                ✅                |
| View AI predictions           |    ✅    |                ✅                |
| Run AI prediction             |    ✅    |                ✅                |
| View appointments             |    ✅    |                ✅                |
| Book appointment              |    ✅    |                ✅                |
| View consultations            |    ✅    |                ✅                |
| View prescriptions            |    ✅    |                ✅                |
| Choose doctor                 |    ✅    |                ✅                |
| Grant doctor access           |    ✅    |                ✅                |
| Revoke doctor access          |    ✅    |                ✅                |
| View authorized doctors       |    ✅    |                ✅                |
| View published knowledge      |    ✅    |                ✅                |
| Deactivate family account     |    ✅    |                ❌                |
| Delete family account         |    ✅    |                ❌                |

---

# 32. Final Family Navigation

The final family sidebar can be:

```text
🏠 Dashboard

👨‍👩‍👧 Family Members

🗂️ Medical Records

📤 Upload Record

🤖 AI Predictions
   ├── Fracture Detection
   ├── Diabetes Risk
   ├── Heart Disease Risk
└── General Health Assessment
   └── Prediction History

👨‍⚕️ Doctors

📅 Appointments

📋 Consultations

💊 Prescriptions

🔐 Doctor Access

📚 MediMind Knowledge


⚙️ Settings
```

---

# ⭐ 33. Complete Family Workflow

```text
                         LOGIN
                           ↓
                    FAMILY ACCOUNT
                           ↓
                    SELECT PROFILE
                           ↓
                 SPECIFIC PATIENT PROFILE
                           │
          ┌────────────────┼─────────────────┐
          ↓                ↓                 ↓
     MEDICAL RECORDS   APPOINTMENTS      AI PREDICTION
          ↓                ↓                 ↓
   Upload / View        Select Doctor     AI Model
          ↓                ↓                 ↓
   Unified Records      Book Slot         AI Result
          │                ↓                 ↓
          │            Consultation     Prediction History
          │                ↓
          │           Prescription
          │
          └───────────────┐
                          ↓
                  CHOOSE DOCTOR
                          ↓
                  GRANT ACCESS
                          ↓
                 DOCTOR GETS ACCESS
                          ↓
               COMPLETE PATIENT RECORD
                          ↓
                  DOCTOR CONSULTATION
                          ↓
              CLINICAL ASSESSMENT
                          ↓
                   PRESCRIPTION
```

---

# ⭐ 34. Doctor Authorization Workflow

The most important access-control workflow is:

```text
Family Account
      ↓
Select Family Member
      ↓
Select Doctor
      ↓
Grant Access
      ↓
Record Access Created
      ↓
Doctor can access
ALL records of that member
      ↓
Doctor Consultation
      ↓
Clinical Assessment
      ↓
Prescription
```

If access is revoked:

```text
Family
   ↓
Select Member
   ↓
Select Doctor
   ↓
Revoke Access
   ↓
Doctor loses access
```

---

# ⭐ 35. Medical Record Ownership Model

The system should distinguish between **family-owned records** and **doctor-created clinical records**.

### Family-created

```text
Family
  ↓
Upload Record
  ↓
Family-owned Medical Record
  ↓
Can be edited/deleted by family
```

### Doctor-created

```text
Doctor
  ↓
Consultation
  ↓
Final Submission
  ↓
Immutable Clinical Record
```

and:

```text
Doctor
  ↓
Prescription
  ↓
Final Submission
  ↓
Immutable Prescription
```

Corrections use:

```text
Original Record
      ↓
Amendment / New Corrected Record
```

This preserves the patient's medical history.

---

# ⭐ 36. Family Account vs Patient Identity

This is the most important architectural distinction for the backend.

```text
                 FAMILY ACCOUNT
                       │
              Authentication
                       │
                       ↓
              Family Account ID
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
     Member A       Member B       Member C
        │              │              │
   Patient ID      Patient ID      Patient ID
        │              │              │
   ┌────┼────┐     ┌───┼────┐     ┌───┼────┐
   ↓    ↓    ↓     ↓   ↓    ↓     ↓   ↓    ↓
Records AI  Appts Records AI Appts Records AI
```

Therefore:

> **Family Account = authentication/account identity**

> **Family Member = patient/medical identity**

This distinction will be extremely important when designing the microservices and database.

---

# ⭐ 37. Final Role 1 Concept

The complete Family Account experience is:

```text
                 👨‍👩‍👧 FAMILY ACCOUNT
                         │
                         ↓
                      LOGIN
                         │
                         ↓
                  SELECT PROFILE
                         │
                         ↓
                👤 FAMILY MEMBER
                         │
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
   🗂️ Records        🤖 AI Prediction    📅 Appointments
       ↓                 ↓                 ↓
   Upload/View       AI-assisted       Select Doctor
       ↓              Result                ↓
       │                 ↓              Consultation
       │                 │                   ↓
       │                 │              Prescription
       │                 │                   ↓
       └─────────────────┼───────────────┐
                         ↓               ↓
                  🔐 Doctor Access   📚 Knowledge
                         ↓               ↓
                   Share Patient      Public Articles
                   With Doctor        & Education
```

### Core principle

> **The family controls the patient's information and chooses which doctor can access it.**

### AI principle

> **MediMind provides AI-assisted prediction and clinical decision support, not autonomous diagnosis.**

### Data principle

> **Patient-specific medical records remain separate from public doctor-authored knowledge.**

### Identity principle

> **One Family Account can contain multiple patient profiles, with all family members able to access the family's medical information while the creator retains account-management privileges.**
> :::
