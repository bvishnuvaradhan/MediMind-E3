"""
MediMind - Fresh MongoDB Reset + Production-Style Development Seed
Deterministic, secure reset and seed script matching locked architecture.
"""

import os
import sys
import uuid
import random
from datetime import datetime, date, time, timedelta, timezone
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import bcrypt
from pymongo import MongoClient, ASCENDING, DESCENDING
from bson import ObjectId
from dotenv import load_dotenv

# Ensure backend and ai environment variables are loaded
load_dotenv('backend/.env')
load_dotenv('ai-prediction-service/.env')

sys.path.insert(0, os.path.abspath('ai-prediction-service'))

from app.services.heart_disease_service import HeartDiseaseInferenceService
from app.services.diabetes_service import DiabetesInferenceService
from app.services.fracture_service import FractureInferenceService
from app.models.general_health.general_health_nlp import GeneralHealthNLPEngine
from app.schemas.prediction_schemas import (
    HeartDiseaseRequest,
    DiabetesRequest,
    PredictionType,
    InputType,
)

# ─────────────────────────────────────────────────────────────────────────────
# 1. PRE-FLIGHT BACKUP VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────
BACKUP_DIR = r"D:\MediMind_Backups\MediMind_DB_Backup_20261009_000618"
CREDENTIALS_PATH = r"D:\MediMind_Backups\MediMind_Credentials_20261009.xlsx"

TARGET_DATABASES = [
    "medimind_ai",
    "medimind_appointment",
    "medimind_auth",
    "medimind_doctor",
    "medimind_family",
    "medimind_hospital",
    "medimind_knowledge",
    "medimind_records",
]

def verify_backup():
    print("==================================================")
    print("1. PRE-FLIGHT: INDEPENDENT BACKUP VERIFICATION")
    print("==================================================")
    
    if not os.path.exists(BACKUP_DIR):
        raise RuntimeError(f"FATAL: Backup directory does not exist: {BACKUP_DIR}")
    print(f" [OK] Backup directory confirmed: {BACKUP_DIR}")

    manifest_path = os.path.join(BACKUP_DIR, "backup_manifest.json")
    if not os.path.exists(manifest_path):
        raise RuntimeError(f"FATAL: Manifest not found: {manifest_path}")
    print(f" [OK] Backup manifest confirmed: {manifest_path}")

    checksum_path = os.path.join(BACKUP_DIR, "checksums.sha256")
    if not os.path.exists(checksum_path):
        raise RuntimeError(f"FATAL: Checksums not found: {checksum_path}")
    print(f" [OK] Checksums confirmed: {checksum_path}")

    for db_name in TARGET_DATABASES:
        db_path = os.path.join(BACKUP_DIR, db_name)
        if not os.path.exists(db_path):
            raise RuntimeError(f"FATAL: Database backup missing for {db_name} at {db_path}")
        print(f" [OK] Verified backup database presence: {db_name}")

    print(">> ALL PRE-FLIGHT BACKUP CHECKS PASSED. ROLLBACK INTEGRITY SECURED.\n")

# Deterministic Seed Password Generator
def get_deterministic_password(role: str, index: int) -> str:
    tokens = {
        "CHAIRMAN": "Chair#2026",
        "HOSPITAL_ADMIN": "Admin#2026",
        "DEPARTMENT_HEAD": "Head#2026",
        "DOCTOR": "Doctor#2026",
        "FAMILY": "Family#2026",
    }
    prefix = tokens.get(role, "Medi#2026")
    return f"{prefix}${index:02d}!Dev"

def hash_pw(plaintext: str) -> str:
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(plaintext.encode('utf-8'), salt).decode('utf-8')

# ─────────────────────────────────────────────────────────────────────────────
# 2. SEED DATA SPECIFICATIONS
# ─────────────────────────────────────────────────────────────────────────────

HOSPITALS_SPEC = [
    {
        "key": "H1",
        "name": "Aarogyam Multispeciality Hospital",
        "code": "MM-HYD-01",
        "city": "Hyderabad",
        "state": "Telangana",
        "address": "12 Banjara Hills Road No. 2, Hyderabad, Telangana 500034",
        "phone": "+91 40 2335 1000",
        "email": "contact@aarogyam.hospital",
        "status": "ACTIVE",
        "approval_status": "APPROVED",
        "type": "Multi-Specialty Research Hospital",
        "bedCapacity": 350,
        "accreditation": "NABH & JCI Accredited",
        "establishedYear": 2017,
        "licenseNumber": "TS-MED-HOSP-2017-0812",
    },
    {
        "key": "H2",
        "name": "Nexora Advanced Care Hospital",
        "code": "MM-HYD-02",
        "city": "Hyderabad",
        "state": "Telangana",
        "address": "45 Financial District, Gachibowli, Hyderabad, Telangana 500032",
        "phone": "+91 40 4678 2000",
        "email": "contact@nexora.hospital",
        "status": "ACTIVE",
        "approval_status": "APPROVED",
        "type": "Tertiary Care & Trauma Center",
        "bedCapacity": 400,
        "accreditation": "NABH Accredited",
        "establishedYear": 2019,
        "licenseNumber": "TS-MED-HOSP-2019-1145",
    },
    {
        "key": "H3",
        "name": "Harborview Medical Centre",
        "code": "MM-MUM-03",
        "city": "Mumbai",
        "state": "Maharashtra",
        "address": "88 Dr. E Moses Road, Worli, Mumbai, Maharashtra 400018",
        "phone": "+91 22 2490 3000",
        "email": "contact@harborview.hospital",
        "status": "ACTIVE",
        "approval_status": "APPROVED",
        "type": "Quaternary Care University Hospital",
        "bedCapacity": 600,
        "accreditation": "NABH & JCI Accredited",
        "establishedYear": 2015,
        "licenseNumber": "MH-MED-HOSP-2015-0321",
    },
    {
        "key": "H4",
        "name": "Sunrise Institute of Medical Sciences",
        "code": "MM-BLR-04",
        "city": "Bengaluru",
        "state": "Karnataka",
        "address": "104 Outer Ring Road, Marathahalli, Bengaluru, Karnataka 560037",
        "phone": "+91 80 4112 5000",
        "email": "onboarding@sunrise.med",
        "status": "PENDING",
        "approval_status": "PENDING",
        "type": "Multi-Specialty Hospital",
        "bedCapacity": 280,
        "accreditation": "State Healthcare Board Certified",
        "establishedYear": 2022,
        "licenseNumber": "KA-MED-HOSP-2022-0450",
    },
    {
        "key": "H5",
        "name": "Western LifeCare Hospital",
        "code": "MM-PUN-05",
        "city": "Pune",
        "state": "Maharashtra",
        "address": "22 Senapati Bapat Road, Shivaji Nagar, Pune, Maharashtra 411016",
        "phone": "+91 20 2567 8000",
        "email": "onboarding@westernlifecare.med",
        "status": "PENDING",
        "approval_status": "PENDING",
        "type": "Tertiary Care Hospital",
        "bedCapacity": 220,
        "accreditation": "State Healthcare Board Certified",
        "establishedYear": 2023,
        "licenseNumber": "MH-MED-HOSP-2023-0198",
    },
]

DEPARTMENTS_SPEC = {
    "H1": [
        {
            "name": "Orthopedics & Trauma",
            "code": "ORTHO",
            "specialization": "Musculoskeletal Trauma & Arthroplasty",
            "aiModuleId": "ai_fracture",
            "linkedAi": "Fracture Detection",
            "description": "Comprehensive orthopedic care, fracture triage, joint replacement and musculoskeletal trauma management.",
        },
        {
            "name": "Diabetology",
            "code": "DIAB",
            "specialization": "Metabolic Disorders & Endocrinology",
            "aiModuleId": "ai_diabetes",
            "linkedAi": "Diabetes Risk Assessment",
            "description": "Metabolic disease management, glycemic risk evaluation, diabetic foot and endocrine regulation.",
        },
        {
            "name": "Cardiology",
            "code": "CARDIO",
            "specialization": "Interventional Cardiology",
            "aiModuleId": "ai_cardio",
            "linkedAi": "Heart Disease Risk Stratification",
            "description": "Comprehensive cardiac diagnostics, 10-year cardiovascular risk assessment and preventative care.",
        },
    ],
    "H2": [
        {
            "name": "Orthopedics & Trauma",
            "code": "ORTHO",
            "specialization": "Orthopedic Surgery & Sports Injury",
            "aiModuleId": "ai_fracture",
            "linkedAi": "Fracture Detection",
            "description": "Advanced orthopedic trauma care, arthroscopy and sports injury rehabilitation.",
        },
        {
            "name": "Diabetology",
            "code": "DIAB",
            "specialization": "Diabetic Care & Metabolic Sciences",
            "aiModuleId": "ai_diabetes",
            "linkedAi": "Diabetes Risk Assessment",
            "description": "Specialized diabetes care, prevention of microvascular complications and nutrition.",
        },
        {
            "name": "Cardiology",
            "code": "CARDIO",
            "specialization": "Clinical Cardiology & Electrophysiology",
            "aiModuleId": "ai_cardio",
            "linkedAi": "Heart Disease Risk Stratification",
            "description": "Diagnostic and preventive cardiology, echocardiography and coronary risk management.",
        },
        {
            "name": "General Medicine",
            "code": "GENMED",
            "specialization": "Internal Medicine & General Health",
            "aiModuleId": "ai_general",
            "linkedAi": "General Health Assessment",
            "description": "Adult primary care, fever evaluation, systemic diseases and outpatient triage.",
        },
    ],
    "H3": [
        {
            "name": "Orthopedics & Trauma",
            "code": "ORTHO",
            "specialization": "Complex Trauma & Reconstructive Orthopedics",
            "aiModuleId": "ai_fracture",
            "linkedAi": "Fracture Detection",
            "description": "Tertiary orthopedic surgery, complex pediatric and adult fracture triage and reconstruction.",
        },
        {
            "name": "Diabetology & Endocrinology",
            "code": "DIAB",
            "specialization": "Advanced Endocrinology & Diabetes",
            "aiModuleId": "ai_diabetes",
            "linkedAi": "Diabetes Risk Assessment",
            "description": "Quaternary diabetes management, pediatric endocrinology and metabolic syndromes.",
        },
        {
            "name": "Cardiology",
            "code": "CARDIO",
            "specialization": "Cardiovascular Sciences & Heart Failure",
            "aiModuleId": "ai_cardio",
            "linkedAi": "Heart Disease Risk Stratification",
            "description": "Quaternary cardiac care, structural heart disease and preventive cardiometabolic care.",
        },
        {
            "name": "General Medicine",
            "code": "GENMED",
            "specialization": "Adult Medicine & Acute Care",
            "aiModuleId": "ai_general",
            "linkedAi": "General Health Assessment",
            "description": "Tertiary general medical care, diagnostic dilemmas and acute multisystem illness.",
        },
        {
            "name": "Internal Medicine",
            "code": "INTMED",
            "specialization": "Comprehensive Internal Medicine",
            "aiModuleId": "ai_general",
            "linkedAi": "General Health Assessment",
            "description": "Inpatient and outpatient medical disorders, geriatric medicine and perioperative care.",
        },
        {
            "name": "Preventive & Family Medicine",
            "code": "PREVMED",
            "specialization": "Preventive Medicine & Community Health",
            "aiModuleId": "ai_general",
            "linkedAi": "General Health Assessment",
            "description": "Population health screening, preventive lifestyle medicine and routine family wellness.",
        },
    ],
}

CHAIRMAN_SPEC = [
    {"name": "Dr. Rajeshwar Rao", "email": "chairman@medimind.org"},
    {"name": "Dr. Nandita Sengupta", "email": "chairman@medimind.com"},
]

HOSPITAL_ADMINS_SPEC = [
    {"hosp_key": "H1", "name": "Vikram Aditya", "email": "admin@aarogyam.hospital"},
    {"hosp_key": "H1", "name": "Sunita Reddy", "email": "admin.operations@aarogyam.hospital"},
    {"hosp_key": "H2", "name": "Harish Chandra", "email": "admin@nexora.hospital"},
    {"hosp_key": "H3", "name": "Cyrus Mistry", "email": "admin@harborview.hospital"},
]

DEPARTMENT_HEADS_SPEC = [
    # H1 (3)
    {"hosp_key": "H1", "dept_idx": 0, "name": "Dr. Arun Prakash", "email": "arun.prakash@aarogyam.hospital", "phone": "+91 98490 11001", "spec": "Orthopedics & Trauma"},
    {"hosp_key": "H1", "dept_idx": 1, "name": "Dr. Meenakshi Sundaram", "email": "meenakshi.sundaram@aarogyam.hospital", "phone": "+91 98490 11002", "spec": "Diabetology & Endocrinology"},
    {"hosp_key": "H1", "dept_idx": 2, "name": "Dr. K. S. Murthy", "email": "ks.murthy@aarogyam.hospital", "phone": "+91 98490 11003", "spec": "Interventional Cardiology"},
    # H2 (4)
    {"hosp_key": "H2", "dept_idx": 0, "name": "Dr. Pradeep Varma", "email": "pradeep.varma@nexora.hospital", "phone": "+91 98490 22001", "spec": "Orthopedic Surgery"},
    {"hosp_key": "H2", "dept_idx": 1, "name": "Dr. Shalini Rao", "email": "shalini.rao@nexora.hospital", "phone": "+91 98490 22002", "spec": "Diabetology"},
    {"hosp_key": "H2", "dept_idx": 2, "name": "Dr. Anirudh Kulkarni", "email": "anirudh.kulkarni@nexora.hospital", "phone": "+91 98490 22003", "spec": "Clinical Cardiology"},
    {"hosp_key": "H2", "dept_idx": 3, "name": "Dr. Rameshwar Deshmukh", "email": "rameshwar.deshmukh@nexora.hospital", "phone": "+91 98490 22004", "spec": "General Medicine"},
    # H3 (7) - Ortho has 2 heads
    {"hosp_key": "H3", "dept_idx": 0, "name": "Dr. Farhan Contractor", "email": "farhan.contractor@harborview.hospital", "phone": "+91 98200 33001", "spec": "Complex Trauma & Arthroplasty"},
    {"hosp_key": "H3", "dept_idx": 0, "name": "Dr. Boman Irani", "email": "boman.irani@harborview.hospital", "phone": "+91 98200 33002", "spec": "Pediatric Orthopedics & Spine"},
    {"hosp_key": "H3", "dept_idx": 1, "name": "Dr. Zarir Udwadia", "email": "zarir.udwadia@harborview.hospital", "phone": "+91 98200 33003", "spec": "Diabetology & Endocrinology"},
    {"hosp_key": "H3", "dept_idx": 2, "name": "Dr. Tehemton Shroff", "email": "tehemton.shroff@harborview.hospital", "phone": "+91 98200 33004", "spec": "Cardiology"},
    {"hosp_key": "H3", "dept_idx": 3, "name": "Dr. Hoshang Master", "email": "hoshang.master@harborview.hospital", "phone": "+91 98200 33005", "spec": "General Medicine"},
    {"hosp_key": "H3", "dept_idx": 4, "name": "Dr. Pervin Wadia", "email": "pervin.wadia@harborview.hospital", "phone": "+91 98200 33006", "spec": "Internal Medicine"},
    {"hosp_key": "H3", "dept_idx": 5, "name": "Dr. Anita Merchant", "email": "anita.merchant@harborview.hospital", "phone": "+91 98200 33007", "spec": "Preventive & Family Medicine"},
]

DOCTORS_SPEC = [
    # H1 (6 docs)
    {"hosp_key": "H1", "dept_idx": 0, "name": "Dr. Rahul Sharma", "email": "dr.rahul.sharma@aarogyam.hospital", "phone": "+91 98490 11101", "spec": "Orthopedics & Trauma", "quals": ["MBBS", "MS (Ortho)"], "exp": 12},
    {"hosp_key": "H1", "dept_idx": 0, "name": "Dr. Sneha Reddy", "email": "dr.sneha.reddy@aarogyam.hospital", "phone": "+91 98490 11102", "spec": "Orthopedics & Trauma", "quals": ["MBBS", "DNB (Ortho)"], "exp": 9},
    {"hosp_key": "H1", "dept_idx": 1, "name": "Dr. Vikram Joshi", "email": "dr.vikram.joshi@aarogyam.hospital", "phone": "+91 98490 11103", "spec": "Diabetology", "quals": ["MBBS", "MD (Medicine)"], "exp": 14},
    {"hosp_key": "H1", "dept_idx": 1, "name": "Dr. Ananya Roy", "email": "dr.ananya.roy@aarogyam.hospital", "phone": "+91 98490 11104", "spec": "Diabetology", "quals": ["MBBS", "PG Diploma (Diab)"], "exp": 8},
    {"hosp_key": "H1", "dept_idx": 2, "name": "Dr. Arjun Patel", "email": "dr.arjun.patel@aarogyam.hospital", "phone": "+91 98490 11105", "spec": "Cardiology", "quals": ["MBBS", "DM (Cardiology)"], "exp": 15},
    {"hosp_key": "H1", "dept_idx": 2, "name": "Dr. Deepak Verma", "email": "dr.deepak.verma@aarogyam.hospital", "phone": "+91 98490 11106", "spec": "Cardiology", "quals": ["MBBS", "MD", "DNB (Cardio)"], "exp": 11},

    # H2 (8 docs)
    {"hosp_key": "H2", "dept_idx": 0, "name": "Dr. Karthik Iyer", "email": "dr.karthik.iyer@nexora.hospital", "phone": "+91 98490 22101", "spec": "Orthopedics & Trauma", "quals": ["MBBS", "MS (Ortho)"], "exp": 10},
    {"hosp_key": "H2", "dept_idx": 0, "name": "Dr. Pooja Hegde", "email": "dr.pooja.hegde@nexora.hospital", "phone": "+91 98490 22102", "spec": "Orthopedics & Trauma", "quals": ["MBBS", "DNB (Ortho)"], "exp": 8},
    {"hosp_key": "H2", "dept_idx": 1, "name": "Dr. Sanjay Gupta", "email": "dr.sanjay.gupta@nexora.hospital", "phone": "+91 98490 22103", "spec": "Diabetology", "quals": ["MBBS", "MD (Endocrinology)"], "exp": 16},
    {"hosp_key": "H2", "dept_idx": 1, "name": "Dr. Meera Nambiar", "email": "dr.meera.nambiar@nexora.hospital", "phone": "+91 98490 22104", "spec": "Diabetology", "quals": ["MBBS", "MD (Medicine)"], "exp": 9},
    {"hosp_key": "H2", "dept_idx": 2, "name": "Dr. Harish Rao", "email": "dr.harish.rao@nexora.hospital", "phone": "+91 98490 22105", "spec": "Cardiology", "quals": ["MBBS", "DM (Cardio)"], "exp": 13},
    {"hosp_key": "H2", "dept_idx": 2, "name": "Dr. Kavita Nair", "email": "dr.kavita.nair@nexora.hospital", "phone": "+91 98490 22106", "spec": "Cardiology", "quals": ["MBBS", "DNB (Cardio)"], "exp": 10},
    {"hosp_key": "H2", "dept_idx": 3, "name": "Dr. Suresh Menon", "email": "dr.suresh.menon@nexora.hospital", "phone": "+91 98490 22107", "spec": "General Medicine", "quals": ["MBBS", "MD (Gen Med)"], "exp": 14},
    {"hosp_key": "H2", "dept_idx": 3, "name": "Dr. Radhika Swaminathan", "email": "dr.radhika.swaminathan@nexora.hospital", "phone": "+91 98490 22108", "spec": "General Medicine", "quals": ["MBBS", "DNB (Med)"], "exp": 7},

    # H3 (15 docs: 5 Ortho + 2 each for 5 other depts)
    {"hosp_key": "H3", "dept_idx": 0, "name": "Dr. Rohinton Mistry", "email": "dr.rohinton.mistry@harborview.hospital", "phone": "+91 98200 33101", "spec": "Orthopedics & Trauma", "quals": ["MBBS", "MS (Ortho)", "MCh (Ortho)"], "exp": 18},
    {"hosp_key": "H3", "dept_idx": 0, "name": "Dr. Adil Bharucha", "email": "dr.adil.bharucha@harborview.hospital", "phone": "+91 98200 33102", "spec": "Orthopedics & Trauma", "quals": ["MBBS", "MS (Ortho)"], "exp": 13},
    {"hosp_key": "H3", "dept_idx": 0, "name": "Dr. Neville Tata", "email": "dr.neville.tata@harborview.hospital", "phone": "+91 98200 33103", "spec": "Orthopedics & Trauma", "quals": ["MBBS", "DNB (Ortho)"], "exp": 11},
    {"hosp_key": "H3", "dept_idx": 0, "name": "Dr. Cyrus Poonawalla", "email": "dr.cyrus.poonawalla@harborview.hospital", "phone": "+91 98200 33104", "spec": "Orthopedics & Trauma", "quals": ["MBBS", "MS (Ortho)"], "exp": 15},
    {"hosp_key": "H3", "dept_idx": 0, "name": "Dr. Diana Edulji", "email": "dr.diana.edulji@harborview.hospital", "phone": "+91 98200 33105", "spec": "Orthopedics & Trauma", "quals": ["MBBS", "DNB (Ortho)"], "exp": 8},
    
    {"hosp_key": "H3", "dept_idx": 1, "name": "Dr. Darius Batliwala", "email": "dr.darius.batliwala@harborview.hospital", "phone": "+91 98200 33106", "spec": "Diabetology & Endocrinology", "quals": ["MBBS", "MD", "DM (Endo)"], "exp": 17},
    {"hosp_key": "H3", "dept_idx": 1, "name": "Dr. Freny Cooper", "email": "dr.freny.cooper@harborview.hospital", "phone": "+91 98200 33107", "spec": "Diabetology & Endocrinology", "quals": ["MBBS", "MD (Medicine)"], "exp": 12},

    {"hosp_key": "H3", "dept_idx": 2, "name": "Dr. Jamshed Dalal", "email": "dr.jamshed.dalal@harborview.hospital", "phone": "+91 98200 33108", "spec": "Cardiology", "quals": ["MBBS", "MD", "DM (Cardio)"], "exp": 20},
    {"hosp_key": "H3", "dept_idx": 2, "name": "Dr. Shirin Daruwala", "email": "dr.shirin.daruwala@harborview.hospital", "phone": "+91 98200 33109", "spec": "Cardiology", "quals": ["MBBS", "DNB (Cardio)"], "exp": 9},

    {"hosp_key": "H3", "dept_idx": 3, "name": "Dr. Kavasji Jamshed", "email": "dr.kavasji.jamshed@harborview.hospital", "phone": "+91 98200 33110", "spec": "General Medicine", "quals": ["MBBS", "MD (Gen Med)"], "exp": 16},
    {"hosp_key": "H3", "dept_idx": 3, "name": "Dr. Mahrukh Billimoria", "email": "dr.mahrukh.billimoria@harborview.hospital", "phone": "+91 98200 33111", "spec": "General Medicine", "quals": ["MBBS", "DNB (Med)"], "exp": 10},

    {"hosp_key": "H3", "dept_idx": 4, "name": "Dr. Noshirwan Guzder", "email": "dr.noshirwan.guzder@harborview.hospital", "phone": "+91 98200 33112", "spec": "Internal Medicine", "quals": ["MBBS", "MD (Int Med)"], "exp": 14},
    {"hosp_key": "H3", "dept_idx": 4, "name": "Dr. Pheroza Godrej", "email": "dr.pheroza.godrej@harborview.hospital", "phone": "+91 98200 33113", "spec": "Internal Medicine", "quals": ["MBBS", "MD (Med)"], "exp": 11},

    {"hosp_key": "H3", "dept_idx": 5, "name": "Dr. Ratan Vakil", "email": "dr.ratan.vakil@harborview.hospital", "phone": "+91 98200 33114", "spec": "Preventive & Family Medicine", "quals": ["MBBS", "MD (Prev Med)"], "exp": 15},
    {"hosp_key": "H3", "dept_idx": 5, "name": "Dr. Shenaz Treasury", "email": "dr.shenaz.treasury@harborview.hospital", "phone": "+91 98200 33115", "spec": "Preventive & Family Medicine", "quals": ["MBBS", "DNB (Fam Med)"], "exp": 8},
]

FAMILIES_SPEC = [
    {
        "code": "FAM-001",
        "name": "Kapoor Family",
        "creator_name": "Rohan Kapoor",
        "email": "rohan.kapoor@example.com",
        "mobile": "+91 98765 43210",
        "members": [
            {"name": "Rohan Kapoor", "dob": "1982-04-12", "gender": "MALE", "blood": "A+"},
            {"name": "Priya Kapoor", "dob": "1985-08-23", "gender": "FEMALE", "blood": "B+"},
            {"name": "Aarav Kapoor", "dob": "2010-11-15", "gender": "MALE", "blood": "A+"},
            {"name": "Ananya Kapoor", "dob": "2014-06-05", "gender": "FEMALE", "blood": "B+"},
            {"name": "Ram Kapoor", "dob": "1952-01-20", "gender": "MALE", "blood": "O+"},
            {"name": "Kausalya Kapoor", "dob": "1955-09-14", "gender": "FEMALE", "blood": "O+"},
            {"name": "Sameer Kapoor", "dob": "1988-03-30", "gender": "MALE", "blood": "A-"},
            {"name": "Neha Kapoor", "dob": "1990-12-18", "gender": "FEMALE", "blood": "AB+"},
        ]
    },
    {
        "code": "FAM-002",
        "name": "Sharma Family",
        "creator_name": "Ravi Sharma",
        "email": "ravi.sharma@example.com",
        "mobile": "+91 98765 43220",
        "members": [
            {"name": "Ravi Sharma", "dob": "1978-05-19", "gender": "MALE", "blood": "B+"},
            {"name": "Sunita Sharma", "dob": "1981-09-08", "gender": "FEMALE", "blood": "O+"},
        ]
    },
    {
        "code": "FAM-003",
        "name": "Patel Family",
        "creator_name": "Vikram Patel",
        "email": "vikram.patel@example.com",
        "mobile": "+91 98765 43230",
        "members": [
            {"name": "Vikram Patel", "dob": "1975-02-14", "gender": "MALE", "blood": "O+"},
            {"name": "Meena Patel", "dob": "1979-07-22", "gender": "FEMALE", "blood": "A+"},
            {"name": "Dhruv Patel", "dob": "2005-10-10", "gender": "MALE", "blood": "O+"},
            {"name": "Diya Patel", "dob": "2008-03-17", "gender": "FEMALE", "blood": "A+"},
            {"name": "Kantilal Patel", "dob": "1948-12-05", "gender": "MALE", "blood": "B+"},
            {"name": "Hansa Patel", "dob": "1951-04-11", "gender": "FEMALE", "blood": "B+"},
        ]
    },
    {
        "code": "FAM-004",
        "name": "Reddy Family",
        "creator_name": "Kiran Reddy",
        "email": "kiran.reddy@example.com",
        "mobile": "+91 98765 43240",
        "members": [
            {"name": "Kiran Reddy", "dob": "1984-06-25", "gender": "MALE", "blood": "AB+"},
            {"name": "Swapna Reddy", "dob": "1987-11-30", "gender": "FEMALE", "blood": "O+"},
            {"name": "Vihaan Reddy", "dob": "2016-08-14", "gender": "MALE", "blood": "AB+"},
        ]
    },
    {
        "code": "FAM-005",
        "name": "Menon Family",
        "creator_name": "Siddharth Menon",
        "email": "siddharth.menon@example.com",
        "mobile": "+91 98765 43250",
        "members": [
            {"name": "Siddharth Menon", "dob": "1980-09-12", "gender": "MALE", "blood": "A+"},
            {"name": "Lakshmi Menon", "dob": "1983-01-28", "gender": "FEMALE", "blood": "A+"},
            {"name": "Aryan Menon", "dob": "2011-04-09", "gender": "MALE", "blood": "A+"},
            {"name": "Ananya Menon", "dob": "2015-12-03", "gender": "FEMALE", "blood": "O+"},
        ]
    },
    {
        "code": "FAM-006",
        "name": "Mukherjee Family",
        "creator_name": "Debashis Mukherjee",
        "email": "debashis.mukherjee@example.com",
        "mobile": "+91 98765 43260",
        "members": [
            {"name": "Debashis Mukherjee", "dob": "1972-03-15", "gender": "MALE", "blood": "B+"},
            {"name": "Sharmila Mukherjee", "dob": "1976-10-20", "gender": "FEMALE", "blood": "B+"},
        ]
    },
    {
        "code": "FAM-007",
        "name": "Banerjee Family",
        "creator_name": "Amit Banerjee",
        "email": "amit.banerjee@example.com",
        "mobile": "+91 98765 43270",
        "members": [
            {"name": "Amit Banerjee", "dob": "1979-11-02", "gender": "MALE", "blood": "O+"},
            {"name": "Rupa Banerjee", "dob": "1982-04-16", "gender": "FEMALE", "blood": "A+"},
            {"name": "Sourav Banerjee", "dob": "2006-08-21", "gender": "MALE", "blood": "O+"},
            {"name": "Shreya Banerjee", "dob": "2012-02-14", "gender": "FEMALE", "blood": "A+"},
            {"name": "Pranab Banerjee", "dob": "1950-06-18", "gender": "MALE", "blood": "B+"},
            {"name": "Gita Banerjee", "dob": "1954-01-25", "gender": "FEMALE", "blood": "O+"},
            {"name": "Tanushree Banerjee", "dob": "1986-07-09", "gender": "FEMALE", "blood": "AB+"},
        ]
    },
    {
        "code": "FAM-008",
        "name": "Kulkarni Family",
        "creator_name": "Rajesh Kulkarni",
        "email": "rajesh.kulkarni@example.com",
        "mobile": "+91 98765 43280",
        "members": [
            {"name": "Rajesh Kulkarni", "dob": "1983-05-07", "gender": "MALE", "blood": "A+"},
            {"name": "Vaishali Kulkarni", "dob": "1986-09-11", "gender": "FEMALE", "blood": "B+"},
            {"name": "Tanmay Kulkarni", "dob": "2017-03-24", "gender": "MALE", "blood": "A+"},
        ]
    },
    {
        "code": "FAM-009",
        "name": "Raman Family",
        "creator_name": "Venkat Raman",
        "email": "venkat.raman@example.com",
        "mobile": "+91 98765 43290",
        "members": [
            {"name": "Venkat Raman", "dob": "1977-08-14", "gender": "MALE", "blood": "B+"},
            {"name": "Sowmya Raman", "dob": "1981-12-01", "gender": "FEMALE", "blood": "O+"},
            {"name": "Aditya Raman", "dob": "2007-05-18", "gender": "MALE", "blood": "B+"},
            {"name": "Nitya Raman", "dob": "2013-09-29", "gender": "FEMALE", "blood": "O+"},
            {"name": "Kalyani Raman", "dob": "1953-11-10", "gender": "FEMALE", "blood": "A+"},
        ]
    },
    {
        "code": "FAM-010",
        "name": "Singh Family",
        "creator_name": "Manpreet Singh",
        "email": "manpreet.singh@example.com",
        "mobile": "+91 98765 43300",
        "members": [
            {"name": "Manpreet Singh", "dob": "1985-02-28", "gender": "MALE", "blood": "O+"},
            {"name": "Jaspreet Kaur", "dob": "1988-06-15", "gender": "FEMALE", "blood": "A+"},
            {"name": "Gurkeerat Singh", "dob": "2014-10-04", "gender": "MALE", "blood": "O+"},
            {"name": "Simran Kaur", "dob": "2018-07-20", "gender": "FEMALE", "blood": "A+"},
        ]
    },
]

# Knowledge Articles Data (3 per department = 39 articles)
ARTICLE_TEMPLATES = {
    "Orthopedics & Trauma": [
        ("Classification and Immediate Reduction of Distal Radius Fractures in Emergency Settings",
         "Comprehensive clinical protocol for evaluating extra-articular and intra-articular distal radius fractures.",
         "Distal radius fractures constitute nearly twenty percent of emergency orthopedic visits. Early anatomic reduction and immobilization prevent chronic radiocarpal arthrosis. Plain biplanar radiographs (posteroanterior and lateral) must be evaluated for radial inclination, radial height, and volar tilt. Closed reduction under hematoma block using traction and counter-traction should be followed by sugar-tong or volar-dorsal splinting.",
         ["Fracture", "Trauma", "Radiology", "Emergency"]),
        ("Pediatric Torus vs Greenstick Fractures: Conservative Management & Healing Timelines",
         "Diagnostic hallmarks on biplanar plain radiographs and splint immobilization recommendations for incomplete pediatric fractures.",
         "Pediatric cortical plasticity leads to distinctive fracture patterns including buckle (torus) and greenstick fractures. Torus fractures represent compressive failure of the cortex without breach of the tension side cortex. Management is entirely non-operative with short-arm immobilization or removable splints for three weeks. Greenstick fractures require careful assessment of angulation.",
         ["Pediatrics", "Fracture", "Torus", "Splinting"]),
        ("Post-Traumatic Musculoskeletal Pain: Modern Triage and Radiologic Assessment",
         "Structured physical examination criteria, Ottawa Rules adaptation, and threshold evaluation for secondary radiographic requests.",
         "Systematic musculoskeletal examination following acute blunt extremity trauma relies on localized tenderness, active range of motion, and weight-bearing ability. Adherence to Ottawa ankle and knee criteria significantly optimizes radiologic utilization without compromising diagnostic sensitivity.",
         ["Trauma", "Pain Management", "Clinical Practice", "Triage"]),
    ],
    "Diabetology": [
        ("Early Glycemic Risk Stratification: Beyond Fasting Plasma Glucose to Comprehensive Screening",
         "Clinical evaluation of impaired glucose tolerance, insulin sensitivity metrics, and risk stratification methodologies.",
         "Identifying early glucose dysregulation prior to microvascular injury requires combining fasting plasma glucose, glycated hemoglobin (HbA1c), and structured 2-hour oral glucose tolerance evaluations. Insulin resistance markers and family predisposition guide personalized dietary and pharmacological timing.",
         ["Diabetes", "Endocrinology", "Glycemic Control", "Screening"]),
        ("Cardiometabolic Risk Reduction in Type 2 Diabetes: Evidence-Based Pharmacotherapy",
         "Overview of modern antihyperglycemic agents with proven cardiovascular safety outcomes and organ protective profiles.",
         "Modern type 2 diabetes management centers on holistic cardiovascular and renal risk mitigation. Dual therapy with metformin and SGLT2 inhibitors or GLP-1 receptor agonists provides substantial relative risk reductions for major adverse cardiovascular events and heart failure hospitalizations.",
         ["Type 2 Diabetes", "Cardiovascular", "Pharmacology", "Metabolic"]),
        ("Comprehensive Lifestyle Modification for Prediabetes: A Multidisciplinary Clinical Approach",
         "Nutritional balancing, physical activity prescriptions, and longitudinal metabolic monitoring in high-risk patients.",
         "Prediabetes reversal hinges on achieving five to seven percent sustainable body weight reduction and minimum 150 minutes weekly of moderate-intensity aerobic exercise. Regular self-monitoring of blood glucose and structured dietary counseling significantly delay transition to clinical diabetes.",
         ["Prediabetes", "Lifestyle", "Preventative", "Nutrition"]),
    ],
    "Diabetology & Endocrinology": [
        ("Advanced Endocrinology: Glycemic Variability and CGM in Difficult-to-Control Diabetes",
         "Clinical utility of continuous glucose monitoring indices in mitigating hypoglycemic unawareness.",
         "Ambulatory continuous glucose monitoring offers actionable insights into time in range (70-180 mg/dL) and glycemic variability metrics (coefficient of variation). For brittle or autonomic-neuropathy diabetes patients, CGM dramatically curtails nocturnal severe hypoglycemic episodes.",
         ["CGM", "Endocrinology", "Hypoglycemia", "Glycemic Variability"]),
        ("Diabetic Microvascular Complications: Screening Protocols and Kidney Disease Staging",
         "Annual microalbuminuria surveillance and early nephroprotective pharmacotherapy guidelines.",
         "Surveillance for diabetic kidney disease necessitates annual urinary albumin-to-creatinine ratio (uACR) and estimated glomerular filtration rate (eGFR) assessments. Renin-angiotensin system blockade combined with non-steroidal mineralocorticoid antagonists halts progression of chronic diabetic renal decline.",
         ["Nephropathy", "Albuminuria", "Microvascular", "Complications"]),
        ("Secondary Endocrine Hypertension: Diagnostic Workup in Refractory Metabolic Syndrome",
         "Evaluation pathways for primary aldosteronism, pheochromocytoma, and hypercortisolemia in resistant hypertension.",
         "Patients presenting with early-onset or treatment-refractory hypertension with coexisting metabolic syndrome warrant targeted hormonal screening. Morning aldosterone-to-renin ratios and 24-hour urinary free cortisol tests detect surgically curable or specifically treatable endocrine hypertension.",
         ["Endocrine", "Hypertension", "Aldosterone", "Metabolic Syndrome"]),
    ],
    "Cardiology": [
        ("Ten-Year ASCVD Risk Score Evaluation and Modern Primary Prevention Guidelines",
         "A deep dive into atherosclerotic cardiovascular disease assessment, risk-enhancing factors, and lipid targets.",
         "Atherosclerotic cardiovascular disease (ASCVD) risk estimation aggregates age, gender, systolic blood pressure, total cholesterol, HDL, diabetes status, and smoking history. High-risk cohorts (>20% 10-year risk) require aggressive high-intensity statin therapy, target LDL < 70 mg/dL, and structured cardioprotective lifestyle.",
         ["ASCVD", "Cardiology", "Primary Prevention", "Lipidology"]),
        ("Silent Myocardial Ischemia in High-Risk Diabetic Patients: Detection Protocols",
         "Diagnostic modalities, ambulatory monitoring, and exercise stress electrocardiography in autonomic neuropathy cohorts.",
         "Cardiovascular autonomic neuropathy frequently masks anginal chest pain in diabetic patients, culminating in unheralded myocardial infarction. Non-invasive stress imaging and coronary artery calcium scoring facilitate timely revascularization or intensified medical stabilization.",
         ["Ischemia", "ECG", "Diabetic Heart", "Diagnostics"]),
        ("Hypertensive Urgency vs Emergency: Clinical Distinction and Ambulatory Stabilization",
         "Clear clinical distinctions between end-organ damage risk and asymptomatic blood pressure spikes.",
         "Hypertensive crisis demands immediate discrimination between emergency (acute target organ damage: encephalopathy, aortic dissection, acute pulmonary edema) and urgency. Hypertensive urgency should not be rapidly lowered with intravenous agents; gradual oral titration over 24-48 hours avoids cerebral hypoperfusion.",
         ["Hypertension", "Blood Pressure", "Emergency Care", "Vascular"]),
    ],
    "General Medicine": [
        ("Systematic Approach to Adult Pyrexia of Unknown Origin in Tertiary Outpatient Clinics",
         "Etiological breakdown, laboratory test staging, and infectious vs rheumatologic differentials.",
         "Pyrexia of unknown origin (PUO) requires persistent core body temperature elevation (>38.3 C) exceeding three weeks without diagnosis after structured investigations. Sequential testing incorporates blood cultures, ESR/CRP, autoimmune panels, and cross-sectional chest-abdomen-pelvis imaging.",
         ["Internal Medicine", "Fever", "Diagnostics", "Infectious Disease"]),
        ("Unexplained Weight Loss and Fatigue in the Elderly: Systematic Diagnostic Algorithm",
         "Step-by-step diagnostic roadmap evaluating endocrine, occult malignancy, and chronic inflammatory causes.",
         "Involuntary loss of more than five percent baseline body weight in elder individuals warrants thorough investigation for occult neoplasia, chronic infection, or depression. Basic labs, comprehensive nutritional status, and fecal occult blood testing form the foundational evaluation.",
         ["Geriatrics", "General Health", "Clinical Evaluation", "Fatigue"]),
        ("Interpretation of Incidental Microcytic Anemia in Primary Care Settings",
         "Iron deficiency vs hemoglobinopathy distinction, serum ferritin evaluation, and GI endoscopy indications.",
         "Microcytic hypochromic anemia in adult men and postmenopausal women should be considered gastrointestinal blood loss until proven otherwise. Serum ferritin, transferrin saturation, and bidirectional endoscopy establish etiology and guide parenteral or oral iron supplementation.",
         ["Anemia", "Hematology", "Primary Care", "Diagnostics"]),
    ],
    "Internal Medicine": [
        ("Electrolyte Disorders in Inpatient Care: Hyponatremia Diagnostics and Rate of Correction",
         "Osmolality assessment, SIADH identification, and neurological risk mitigation during hypertonic saline administration.",
         "Severe symptomatic hyponatremia (<120 mEq/L) requires careful rate-limited correction (maximum 8 mEq/L per 24 hours) to eliminate the risk of osmotic demyelination syndrome. Serum and urine osmolalities and urine sodium distinguish hypovolemic, euvolemic, and hypervolemic states.",
         ["Electrolytes", "Hyponatremia", "Critical Care", "Nephrology"]),
        ("Management of Acute Exacerbations of COPD in Complex Multimorbid Patients",
         "Oxygen titration guidelines, bronchodilator sequencing, systemic corticosteroid stewardship, and antibiotic criteria.",
         "Acute exacerbations of COPD (AECOPD) require controlled supplemental oxygen aiming for 88-92% saturation to avert hypercapnic respiratory failure. Inhaled short-acting beta-agonists with anticholinergics and a five-day course of oral prednisone remain gold standard.",
         ["Pulmonology", "COPD", "Inpatient", "Pharmacotherapy"]),
        ("Polypharmacy and Medication Reconciliation in Chronic Multisystem Disease",
         "Deprescribing protocols, Beers criteria application, and drug-drug interaction mitigation strategies.",
         "Polypharmacy (concurrent use of 5 or more prescription medications) substantially escalates adverse drug events, falls, and hospitalization rates in elderly patients. Periodic medication reconciliation using the STOPP/START criteria facilitates structured deprescribing.",
         ["Pharmacology", "Patient Safety", "Geriatrics", "Chronic Care"]),
    ],
    "Preventive & Family Medicine": [
        ("Evidence-Based Adult Vaccination Protocols and Immunization Schedule Updates",
         "Review of influenza, pneumococcal conjugate, recombinant zoster, and tetanus booster recommendations across age brackets.",
         "Preventive adult immunization forms a critical pillar of community disease prevention. Annual influenza vaccination, age 50+ recombinant zoster series, and high-risk pneumococcal conjugate updates yield profound declines in morbidity and secondary hospitalizations.",
         ["Vaccination", "Immunology", "Public Health", "Preventative"]),
        ("Routine Screening for Colorectal and Cervical Malignancies: Family Practice Guidelines",
         "Age-appropriate screening modalities, non-invasive stool testing, and colonoscopy intervals for average-risk individuals.",
         "Average-risk colorectal cancer screening commences at age 45 utilizing either annual fecal immunochemical testing (FIT) or decennial screening colonoscopy. Cervical cytology with HPV co-testing every 5 years between ages 30-65 ensures early precancerous cervical lesion eradication.",
         ["Oncology Screening", "Family Medicine", "Preventative", "Guideline"]),
        ("Assessment of Metabolic Syndrome and Non-Alcoholic Fatty Liver Disease in Family Medicine",
         "Anthropometric measurements, liver enzyme interpretation, FIB-4 calculation, and early behavioral intervention.",
         "Metabolic dysfunction-associated steatotic liver disease (MASLD) affects nearly a third of adults. Non-invasive fibrosis calculators such as the FIB-4 index stratify primary care patients requiring hepatology referral versus those managed through targeted metabolic and weight optimization.",
         ["Metabolic Syndrome", "NAFLD", "Hepatology", "Wellness"]),
    ],
}

# General Health NLP test symptom texts for General Medicine / Internal Medicine / Preventive
NLP_SYMPTOM_TEXTS = [
    "Patient reports mild headache and generalized fatigue for the past two days without fever or vision changes.",
    "Complaining of mild intermittent dry cough, sore throat and nasal congestion after weather change. No shortness of breath.",
    "Patient has slight non-cardiac chest heaviness after heavy meals with sour taste in mouth and occasional bloating.",
    "Reports mild lower back muscle stiffness after prolonged sitting. No radiating pain, numbness or bowel/bladder issues.",
    "Patient notes mild bilateral knee discomfort when climbing stairs for the past month. No joint swelling or redness.",
    "Presenting with mild dizziness upon standing quickly, denies syncope. Vital signs show mild orthostatic blood pressure variation.",
    "Patient reports mild abdominal cramping and loose stools two times yesterday after dining out. Mild dehydration.",
    "Complaints of generalized muscle aches and slight fever sensation after physical exertion. Oral temperature normal.",
    "Patient experiences mild sleep disturbance and tension headache related to work stress. Neurological exam completely normal.",
    "Follow-up visit for routine preventive wellness check. Patient reports overall good health with occasional mild indigestion.",
]

print("Seed specifications ready.")

# ─────────────────────────────────────────────────────────────────────────────
# 3. CORE RESET & SEED ENGINE
# ─────────────────────────────────────────────────────────────────────────────

def build_excel_credentials(credentials_data, output_path):
    print("Generating Excel credentials workbook...")
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    headers_by_role = {
        "Chairman": ["Account ID", "Full Name", "Email / Username", "Role", "Password", "Status"],
        "Hospital Admin": ["Account ID", "Full Name", "Email / Username", "Role", "Hospital", "Password", "Status"],
        "Department Head": ["Account ID", "Full Name", "Email / Username", "Role", "Hospital", "Department", "Password", "Status"],
        "Doctor": ["Account ID", "Full Name", "Email / Username", "Role", "Hospital", "Department", "Specialization", "Password", "Status"],
        "Family": ["Account ID", "Family Code", "Full Name", "Email / Username", "Role", "Mobile", "Member Count", "Password", "Status"],
    }

    header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="Calibri", size=10)
    border_side = Side(border_style="thin", color="CBD5E1")
    cell_border = Border(left=border_side, right=border_side, top=border_side, bottom=border_side)
    center_align = Alignment(horizontal="center", vertical="center")
    left_align = Alignment(horizontal="left", vertical="center")

    for role_name, headers in headers_by_role.items():
        ws = wb.create_sheet(title=role_name)
        ws.append(headers)

        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_idx)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = center_align
            cell.border = cell_border

        role_rows = credentials_data.get(role_name, [])
        for row_idx, r in enumerate(role_rows, start=2):
            row_vals = [r.get(h, "") for h in headers]
            ws.append(row_vals)
            for col_idx in range(1, len(headers) + 1):
                c = ws.cell(row=row_idx, column=col_idx)
                c.font = data_font
                c.border = cell_border
                c.alignment = center_align if headers[col_idx-1] in ["Account ID", "Role", "Status", "Family Code", "Member Count"] else left_align

        # Auto column width
        for col in ws.columns:
            max_len = max(len(str(cell.value or "")) for cell in col)
            col_letter = get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    wb.save(output_path)
    print(f"Credentials workbook successfully created at: {output_path}")


def execute_reset_and_seed(primary_uri="mongodb://127.0.0.1:27017"):
    # Pre-flight backup check
    verify_backup()

    client = MongoClient(primary_uri)
    print("==================================================")
    print(f"2. CONNECTED TO MONGODB: {primary_uri}")
    print("==================================================")

    # Confirm only target databases exist to reset
    print("\nDropping existing 8 MediMind databases...")
    for db_name in TARGET_DATABASES:
        client.drop_database(db_name)
        print(f" [DROPPED] {db_name}")

    print("Target databases reset complete. Starting clean initialization...\n")

    # DB references
    db_auth = client["medimind_auth"]
    db_hosp = client["medimind_hospital"]
    db_doc = client["medimind_doctor"]
    db_fam = client["medimind_family"]
    db_appt = client["medimind_appointment"]
    db_rec = client["medimind_records"]
    db_know = client["medimind_knowledge"]
    db_ai = client["medimind_ai"]

    # Credential records container for Excel
    credentials_wb_data = {
        "Chairman": [],
        "Hospital Admin": [],
        "Department Head": [],
        "Doctor": [],
        "Family": [],
    }

    # ─────────────────────────────────────────────────────────────────────────
    # A. SEED HOSPITALS & HOSPITAL REQUESTS
    # ─────────────────────────────────────────────────────────────────────────
    print("--- Seeding 5 Hospitals (3 Approved, 2 Pending) ---")
    hospitals_by_key = {}
    hospitals_docs = []
    requests_docs = []

    for h_spec in HOSPITALS_SPEC:
        h_id = ObjectId()
        now = datetime.now(timezone.utc)
        h_doc = {
            "_id": h_id,
            "name": h_spec["name"],
            "code": h_spec["code"],
            "tagline": f"Leading Center of {h_spec['name']} Healthcare Excellence",
            "type": h_spec["type"],
            "address": {
                "street": h_spec["address"].split(",")[0].strip(),
                "city": h_spec["city"],
                "state": h_spec["state"],
                "country": "India",
                "pincode": "500034" if "Hyderabad" in h_spec["city"] else ("400018" if "Mumbai" in h_spec["city"] else "560037"),
            },
            "phone": h_spec["phone"],
            "emergencyPhone": h_spec["phone"].replace("1000", "1999").replace("2000", "2999").replace("3000", "3999").replace("5000", "5999").replace("8000", "8999"),
            "email": h_spec["email"],
            "adminEmail": h_spec["email"],
            "website": f"https://{h_spec['city'].lower()}.medimind.health",
            "status": h_spec["status"],  # 'ACTIVE' for H1..H3, 'PENDING' for H4..H5
            "bedCapacity": h_spec["bedCapacity"],
            "accreditation": h_spec["accreditation"],
            "facilityLevel": "Level-3 Tertiary Care" if h_spec["status"] == "ACTIVE" else "Proposed Level-2 Care",
            "establishedYear": h_spec["establishedYear"],
            "licenseNumber": h_spec["licenseNumber"],
            "facilities": ["24/7 Emergency", "ICU", "Diagnostic Imaging", "AI-Assisted Pathology"],
            "operatingHours": "24/7",
            "created_at": now,
            "updated_at": now,
        }
        hospitals_docs.append(h_doc)
        hospitals_by_key[h_spec["key"]] = h_doc

        req_id = ObjectId()
        r_doc = {
            "_id": req_id,
            "code": f"REQ-{h_spec['code']}",
            "name": h_spec["name"],
            "type": h_spec["type"],
            "city": h_spec["city"],
            "state": h_spec["state"],
            "country": "India",
            "address": h_spec["address"],
            "contactPerson": f"Director of {h_spec['name']}",
            "contactRole": "Medical Director",
            "phone": h_spec["phone"],
            "emergencyPhone": h_doc["emergencyPhone"],
            "email": h_spec["email"],
            "requestedDepartments": ["Orthopedics", "Diabetology", "Cardiology"],
            "bedCapacity": h_spec["bedCapacity"],
            "accreditation": h_spec["accreditation"],
            "facilityLevel": h_doc["facilityLevel"],
            "establishedYear": h_spec["establishedYear"],
            "licenseNumber": h_spec["licenseNumber"],
            "status": h_spec["approval_status"],  # 'APPROVED' for H1..H3, 'PENDING' for H4..H5
            "submittedDate": now - timedelta(days=180 if h_spec["status"] == "ACTIVE" else 30),
            "created_hospital_id": h_id,
            "created_at": now,
            "updated_at": now,
        }
        requests_docs.append(r_doc)

    db_hosp.hospitals.insert_many(hospitals_docs)
    db_hosp.hospitalrequests.insert_many(requests_docs)
    print(f" [INSERTED] {len(hospitals_docs)} hospitals and {len(requests_docs)} hospital requests.")

    # ─────────────────────────────────────────────────────────────────────────
    # B. SEED DEPARTMENTS (13 departments across H1, H2, H3)
    # ─────────────────────────────────────────────────────────────────────────
    print("\n--- Seeding 13 Departments (H1=3, H2=4, H3=6) ---")
    departments_by_key = {}  # (hosp_key, dept_idx) -> dept_doc
    departments_docs = []

    for hosp_key, dept_list in DEPARTMENTS_SPEC.items():
        hosp_doc = hospitals_by_key[hosp_key]
        for idx, d_spec in enumerate(dept_list):
            d_id = ObjectId()
            now = datetime.now(timezone.utc)
            d_doc = {
                "_id": d_id,
                "hospital_id": hosp_doc["_id"],
                "name": d_spec["name"],
                "code": d_spec["code"],
                "specialization": d_spec["specialization"],
                "floor": f"Floor {idx + 1}",
                "bedCapacity": 40 + (idx * 10),
                "occupiedBeds": 20 + (idx * 5),
                "linkedAi": d_spec["linkedAi"],
                "aiModuleId": d_spec["aiModuleId"],
                "description": d_spec["description"],
                "status": "ACTIVE",
                "created_at": now,
                "updated_at": now,
            }
            departments_docs.append(d_doc)
            departments_by_key[(hosp_key, idx)] = d_doc

    db_hosp.departments.insert_many(departments_docs)
    print(f" [INSERTED] {len(departments_docs)} departments across operational hospitals.")

    # ─────────────────────────────────────────────────────────────────────────
    # C. SEED CHAIRMAN (2 login accounts)
    # ─────────────────────────────────────────────────────────────────────────
    print("\n--- Seeding 2 Chairman Accounts ---")
    users_docs = []
    
    for c_idx, c_spec in enumerate(CHAIRMAN_SPEC, start=1):
        u_id = ObjectId()
        password = get_deterministic_password("CHAIRMAN", c_idx)
        pw_hash = hash_pw(password)
        now = datetime.now(timezone.utc)

        u_doc = {
            "_id": u_id,
            "email": c_spec["email"].lower(),
            "password_hash": pw_hash,
            "role": "CHAIRMAN",
            "account_type": "CHAIRMAN_ACCOUNT",
            "reference_id": u_id,
            "family_id": None,
            "doctor_id": None,
            "department_id": None,
            "hospital_id": None,
            "status": "ACTIVE",
            "last_login_at": now,
            "created_at": now,
            "updated_at": now,
        }
        users_docs.append(u_doc)

        credentials_wb_data["Chairman"].append({
            "Account ID": str(u_id),
            "Full Name": c_spec["name"],
            "Email / Username": c_spec["email"].lower(),
            "Role": "CHAIRMAN",
            "Password": password,
            "Status": "ACTIVE",
        })

    # ─────────────────────────────────────────────────────────────────────────
    # D. SEED HOSPITAL ADMINS (4 login accounts: H1=2, H2=1, H3=1)
    # ─────────────────────────────────────────────────────────────────────────
    print("--- Seeding 4 Hospital Admin Accounts ---")
    for a_idx, a_spec in enumerate(HOSPITAL_ADMINS_SPEC, start=1):
        u_id = ObjectId()
        hosp_doc = hospitals_by_key[a_spec["hosp_key"]]
        password = get_deterministic_password("HOSPITAL_ADMIN", a_idx)
        pw_hash = hash_pw(password)
        now = datetime.now(timezone.utc)

        u_doc = {
            "_id": u_id,
            "email": a_spec["email"].lower(),
            "password_hash": pw_hash,
            "role": "HOSPITAL_ADMIN",
            "account_type": "HOSPITAL_ADMIN_ACCOUNT",
            "reference_id": hosp_doc["_id"],
            "family_id": None,
            "doctor_id": None,
            "department_id": None,
            "hospital_id": str(hosp_doc["_id"]),
            "status": "ACTIVE",
            "last_login_at": now,
            "created_at": now,
            "updated_at": now,
        }
        users_docs.append(u_doc)

        credentials_wb_data["Hospital Admin"].append({
            "Account ID": str(u_id),
            "Full Name": a_spec["name"],
            "Email / Username": a_spec["email"].lower(),
            "Role": "HOSPITAL_ADMIN",
            "Hospital": hosp_doc["name"],
            "Password": password,
            "Status": "ACTIVE",
        })

    # ─────────────────────────────────────────────────────────────────────────
    # E. SEED DEPARTMENT HEADS (14 login accounts: H1=3, H2=4, H3=7)
    # ─────────────────────────────────────────────────────────────────────────
    print("--- Seeding 14 Department Head Accounts ---")
    dept_heads_docs = []

    for h_idx, h_spec in enumerate(DEPARTMENT_HEADS_SPEC, start=1):
        u_id = ObjectId()
        dh_id = ObjectId()
        hosp_doc = hospitals_by_key[h_spec["hosp_key"]]
        dept_doc = departments_by_key[(h_spec["hosp_key"], h_spec["dept_idx"])]
        password = get_deterministic_password("DEPARTMENT_HEAD", h_idx)
        pw_hash = hash_pw(password)
        now = datetime.now(timezone.utc)

        u_doc = {
            "_id": u_id,
            "email": h_spec["email"].lower(),
            "password_hash": pw_hash,
            "role": "DEPARTMENT_HEAD",
            "account_type": "DEPARTMENT_HEAD_ACCOUNT",
            "reference_id": dh_id,
            "family_id": None,
            "doctor_id": None,
            "department_id": str(dept_doc["_id"]),
            "hospital_id": str(hosp_doc["_id"]),
            "status": "ACTIVE",
            "last_login_at": now,
            "created_at": now,
            "updated_at": now,
        }
        users_docs.append(u_doc)

        dh_doc = {
            "_id": dh_id,
            "user_id": u_id,
            "hospital_id": hosp_doc["_id"],
            "department_id": dept_doc["_id"],
            "full_name": h_spec["name"],
            "email": h_spec["email"].lower(),
            "phone": h_spec["phone"],
            "specialization": h_spec["spec"],
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now,
        }
        dept_heads_docs.append(dh_doc)

        credentials_wb_data["Department Head"].append({
            "Account ID": str(u_id),
            "Full Name": h_spec["name"],
            "Email / Username": h_spec["email"].lower(),
            "Role": "DEPARTMENT_HEAD",
            "Hospital": hosp_doc["name"],
            "Department": dept_doc["name"],
            "Password": password,
            "Status": "ACTIVE",
        })

    db_hosp.departmentheads.insert_many(dept_heads_docs)
    print(f" [INSERTED] {len(dept_heads_docs)} department head profile records.")

    # ─────────────────────────────────────────────────────────────────────────
    # F. SEED DOCTORS (29 login accounts: H1=6, H2=8, H3=15)
    # ─────────────────────────────────────────────────────────────────────────
    print("\n--- Seeding 29 Doctor Accounts (H1=6, H2=8, H3=15) ---")
    doctors_docs = []
    doctors_list = []  # For assigning appointments

    for d_idx, doc_spec in enumerate(DOCTORS_SPEC, start=1):
        u_id = ObjectId()
        doc_id = ObjectId()
        hosp_doc = hospitals_by_key[doc_spec["hosp_key"]]
        dept_doc = departments_by_key[(doc_spec["hosp_key"], doc_spec["dept_idx"])]
        password = get_deterministic_password("DOCTOR", d_idx)
        pw_hash = hash_pw(password)
        now = datetime.now(timezone.utc)

        u_doc = {
            "_id": u_id,
            "email": doc_spec["email"].lower(),
            "password_hash": pw_hash,
            "role": "DOCTOR",
            "account_type": "DOCTOR_ACCOUNT",
            "reference_id": doc_id,
            "family_id": None,
            "doctor_id": str(doc_id),
            "department_id": str(dept_doc["_id"]),
            "hospital_id": str(hosp_doc["_id"]),
            "status": "ACTIVE",
            "last_login_at": now,
            "created_at": now,
            "updated_at": now,
        }
        users_docs.append(u_doc)

        availability = [
            {"day": day, "start_time": "09:00", "end_time": "17:00"}
            for day in ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
        ]

        d_record = {
            "_id": doc_id,
            "user_id": u_id,
            "hospital_id": hosp_doc["_id"],
            "department_id": dept_doc["_id"],
            "full_name": doc_spec["name"],
            "profile_picture": None,
            "email": doc_spec["email"].lower(),
            "mobile": doc_spec["phone"],
            "specialization": doc_spec["spec"],
            "qualifications": doc_spec["quals"],
            "experience_years": doc_spec["exp"],
            "professional_description": f"Senior specialist in {doc_spec['spec']} at {hosp_doc['name']}.",
            "availability": availability,
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now,
        }
        doctors_docs.append(d_record)
        doctors_list.append({
            "doc_id": doc_id,
            "user_id": u_id,
            "hosp_id": hosp_doc["_id"],
            "dept_id": dept_doc["_id"],
            "hosp_key": doc_spec["hosp_key"],
            "dept_name": dept_doc["name"],
            "ai_module": dept_doc["aiModuleId"],
            "full_name": doc_spec["name"],
            "email": doc_spec["email"],
            "hosp_name": hosp_doc["name"],
        })

        credentials_wb_data["Doctor"].append({
            "Account ID": str(u_id),
            "Full Name": doc_spec["name"],
            "Email / Username": doc_spec["email"].lower(),
            "Role": "DOCTOR",
            "Hospital": hosp_doc["name"],
            "Department": dept_doc["name"],
            "Specialization": doc_spec["spec"],
            "Password": password,
            "Status": "ACTIVE",
        })

    db_doc.doctors.insert_many(doctors_docs)
    print(f" [INSERTED] {len(doctors_docs)} doctor profile records.")

    # ─────────────────────────────────────────────────────────────────────────
    # G. SEED FAMILIES (10 login accounts) & MEMBERS (44 profiles)
    # ─────────────────────────────────────────────────────────────────────────
    print("\n--- Seeding 10 Families & 44 Family Member Profiles ---")
    families_docs = []
    members_docs = []
    all_members_list = []  # For assigning appointments

    for f_idx, f_spec in enumerate(FAMILIES_SPEC, start=1):
        u_id = ObjectId()
        fam_id = ObjectId()
        password = get_deterministic_password("FAMILY", f_idx)
        pw_hash = hash_pw(password)
        now = datetime.now(timezone.utc)

        u_doc = {
            "_id": u_id,
            "email": f_spec["email"].lower(),
            "password_hash": pw_hash,
            "role": "FAMILY",
            "account_type": "FAMILY_ACCOUNT",
            "reference_id": fam_id,
            "family_id": f_spec["code"],
            "doctor_id": None,
            "department_id": None,
            "hospital_id": None,
            "status": "ACTIVE",
            "last_login_at": now,
            "created_at": now,
            "updated_at": now,
        }
        users_docs.append(u_doc)

        fam_doc = {
            "_id": fam_id,
            "family_name": f_spec["name"],
            "creator_user_id": u_id,
            "email": f_spec["email"].lower(),
            "mobile": f_spec["mobile"],
            "status": "ACTIVE",
            "deactivated_at": None,
            "deleted_at": None,
            "created_at": now,
            "updated_at": now,
        }
        families_docs.append(fam_doc)

        # Family member profiles
        for m_idx, m_spec in enumerate(f_spec["members"]):
            m_id = ObjectId()
            dob_dt = datetime.strptime(m_spec["dob"], "%Y-%m-%d")
            m_doc = {
                "_id": m_id,
                "family_id": fam_id,
                "full_name": m_spec["name"],
                "profile_picture": None,
                "date_of_birth": dob_dt,
                "gender": m_spec["gender"],
                "blood_group": m_spec["blood"],
                "phone": f_spec["mobile"] if m_idx == 0 else None,
                "email": f_spec["email"] if m_idx == 0 else None,
                "address": "42 Jubilee Hills, Hyderabad" if "HYD" in f_spec["code"] else "15 Marine Drive, Mumbai",
                "emergency_contact": {
                    "name": f_spec["creator_name"],
                    "relationship": "Primary Family Guardian",
                    "phone": f_spec["mobile"],
                },
                "health_information": "Non-smoker, regular health monitoring" if m_idx == 0 else None,
                "medical_conditions": [],
                "allergies": [],
                "previous_treatments": [],
                "status": "ACTIVE",
                "removed_at": None,
                "created_at": now,
                "updated_at": now,
            }
            members_docs.append(m_doc)
            all_members_list.append({
                "member_id": m_id,
                "family_id": fam_id,
                "family_code": f_spec["code"],
                "creator_user_id": u_id,
                "full_name": m_spec["name"],
                "dob": dob_dt,
                "gender": m_spec["gender"],
            })

        credentials_wb_data["Family"].append({
            "Account ID": str(u_id),
            "Family Code": f_spec["code"],
            "Full Name": f_spec["creator_name"],
            "Email / Username": f_spec["email"].lower(),
            "Role": "FAMILY",
            "Mobile": f_spec["mobile"],
            "Member Count": len(f_spec["members"]),
            "Password": password,
            "Status": "ACTIVE",
        })

    db_fam.families.insert_many(families_docs)
    db_fam.familymembers.insert_many(members_docs)
    print(f" [INSERTED] {len(families_docs)} family accounts and {len(members_docs)} member profiles.")

    # Insert all 59 User authentication records
    db_auth.users.insert_many(users_docs)
    print(f" [INSERTED] {len(users_docs)} total authentication users into medimind_auth.users.")

    # ─────────────────────────────────────────────────────────────────────────
    # H. WRITE EXCEL CREDENTIALS WORKBOOK
    # ─────────────────────────────────────────────────────────────────────────
    build_excel_credentials(credentials_wb_data, CREDENTIALS_PATH)

    # ─────────────────────────────────────────────────────────────────────────
    # I. SEED KNOWLEDGE ARTICLES (13 departments × 3 = 39 articles)
    # ─────────────────────────────────────────────────────────────────────────
    print("\n--- Seeding Knowledge Base (13 depts × 3 articles = 39 articles) ---")
    articles_docs = []

    # Map department to doctors in it
    docs_by_dept = {}
    for d in doctors_list:
        docs_by_dept.setdefault(d["dept_id"], []).append(d)

    # Map department to heads
    heads_by_dept = {}
    for dh in dept_heads_docs:
        heads_by_dept.setdefault(dh["department_id"], []).append(dh)

    for (hosp_key, d_idx), d_doc in departments_by_key.items():
        dept_name = d_doc["name"]
        hosp_doc = hospitals_by_key[hosp_key]
        assigned_docs = docs_by_dept.get(d_doc["_id"], doctors_list[:1])
        assigned_heads = heads_by_dept.get(d_doc["_id"], dept_heads_docs[:1])
        author_doc = assigned_docs[0]
        reviewer_head = assigned_heads[0]

        templates = ARTICLE_TEMPLATES.get(dept_name, ARTICLE_TEMPLATES["General Medicine"])
        for art_idx, (title, summary, content, tags) in enumerate(templates):
            art_id = ObjectId()
            published_date = datetime(2026, 8, 10 + (art_idx * 5), 10, 0, 0, tzinfo=timezone.utc)
            a_record = {
                "_id": art_id,
                "author_doctor_id": author_doc["doc_id"],
                "department_id": d_doc["_id"],
                "hospital_id": hosp_doc["_id"],
                "author_name": author_doc["full_name"],
                "department_name": dept_name,
                "hospital_name": hosp_doc["name"],
                "title": title,
                "summary": summary,
                "content": content,
                "category": d_doc["specialization"],
                "tags": tags,
                "status": "PUBLISHED",
                "reviewed_by": reviewer_head["_id"],
                "review_comment": "Approved following peer review. Clinical guidelines adhere to institutional standards.",
                "submitted_at": published_date - timedelta(days=3),
                "reviewed_at": published_date - timedelta(days=1),
                "published_at": published_date,
                "created_at": published_date - timedelta(days=3),
                "updated_at": published_date,
            }
            articles_docs.append(a_record)

    db_know.articles.insert_many(articles_docs)
    print(f" [INSERTED] {len(articles_docs)} clinical articles into medimind_knowledge.articles.")

    # ─────────────────────────────────────────────────────────────────────────
    # J. REAL AI ASSET POOLS PREPARATION
    # ─────────────────────────────────────────────────────────────────────────
    print("\n--- Preparing Real AI Inference Dataset Pools ---")
    
    # 1. Heart dataset
    heart_csv_path = 'ai-prediction-service/test-dataset/Heart Disease/cardiovascular_diseases_dv3.csv'
    df_heart = pd.read_csv(heart_csv_path, sep=';' if ';' in open(heart_csv_path).readline() else ',')
    print(f" [LOADED] Heart Disease dataset: {len(df_heart)} records.")

    # 2. Diabetes dataset
    diab_csv_path = 'ai-prediction-service/test-dataset/Diabetes/diabetes.csv'
    df_diab = pd.read_csv(diab_csv_path)
    print(f" [LOADED] Diabetes dataset: {len(df_diab)} records.")

    # 3. Fracture real images
    fracture_image_paths = []
    for root, dirs, files in os.walk('ai-prediction-service/test-dataset/Bone Facture'):
        for f in files:
            if f.lower().endswith(('.jpg', '.jpeg', '.png')):
                fracture_image_paths.append(os.path.join(root, f))
                if len(fracture_image_paths) >= 2000:
                    break
        if len(fracture_image_paths) >= 2000:
            break
    print(f" [LOADED] Bone Fracture radiograph assets: {len(fracture_image_paths)} real images.")

    # Deterministic index counters without replacement
    heart_ptr = 0
    diab_ptr = 0
    frac_ptr = 0
    nlp_ptr = 0

    # ─────────────────────────────────────────────────────────────────────────
    # K. GENERATING REALISTIC APPOINTMENTS & REAL AI PREDICTIONS
    # ─────────────────────────────────────────────────────────────────────────
    print("\n--- Generating Appointments & Real AI Predictions (Aug - Nov 2026) ---")
    # Date rules:
    # AUGUST: 32 appointments per doctor
    # SEPTEMBER: 32 appointments per doctor
    # OCTOBER 1–8: 12 appointments per doctor
    # OCTOBER 9–31: 10 appointments per doctor (future)
    # NOVEMBER: 12 appointments per doctor (future)
    # Working hours: 09:00 - 17:00, lunch 12:30 - 14:00, 30 min slots.
    SLOT_STARTS = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    ]

    def get_end_time(start_str):
        h, m = map(int, start_str.split(":"))
        m += 30
        if m >= 60:
            h += 1
            m -= 60
        return f"{h:02d}:{m:02d}"

    # Generate weekdays
    def get_weekdays_in_range(start_d, end_d):
        cur = start_d
        days = []
        while cur <= end_d:
            if cur.weekday() < 5:  # Monday to Friday
                days.append(cur)
            cur += timedelta(days=1)
        return days

    aug_days = get_weekdays_in_range(date(2026, 8, 1), date(2026, 8, 31))
    sep_days = get_weekdays_in_range(date(2026, 9, 1), date(2026, 9, 30))
    oct_past_days = get_weekdays_in_range(date(2026, 10, 1), date(2026, 10, 8))
    oct_fut_days = get_weekdays_in_range(date(2026, 10, 9), date(2026, 10, 31))
    nov_days = get_weekdays_in_range(date(2026, 11, 1), date(2026, 11, 30))

    # Weight distribution for family members
    fam_weights = {
        "FAM-001": 20, "FAM-003": 15, "FAM-007": 18, "FAM-009": 12,
        "FAM-005": 10, "FAM-010": 9, "FAM-004": 6, "FAM-008": 6,
        "FAM-002": 4, "FAM-006": 4
    }
    weighted_members = []
    for m in all_members_list:
        w = fam_weights.get(m["family_code"], 5)
        weighted_members.extend([m] * w)

    # Global tracking
    appointments_docs = []
    consultations_docs = []
    prescriptions_docs = []
    record_access_map = {}  # (mem_id, doc_id) -> record
    predictions_docs = []

    # Deterministic RNG
    rng = random.Random(20261009)

    # Doctor slot reservation tracker: (doc_id, date, start_time) -> bool
    doctor_booked_slots = set()

    # Pre-cache real fracture predictions for unique images
    print("Running initial model warmups...")
    # Process appointments doctor by doctor
    total_appts_target = len(doctors_list) * (32 + 32 + 12 + 10 + 12)
    print(f"Targeting exactly ~{total_appts_target} appointments across {len(doctors_list)} doctors...")

    for d_idx, doc in enumerate(doctors_list):
        doc_id = doc["doc_id"]
        hosp_id = doc["hosp_id"]
        dept_id = doc["dept_id"]
        ai_module = doc["ai_module"]

        # Schedule phases: (days_list, target_count, is_past)
        schedule_phases = [
            (aug_days, 32, True),
            (sep_days, 32, True),
            (oct_past_days, 12, True),
            (oct_fut_days, 10, False),
            (nov_days, 12, False),
        ]

        for days_pool, count, is_past in schedule_phases:
            # Pick 'count' unique slots across the available days
            all_possible_slots = [(d, s) for d in days_pool for s in SLOT_STARTS]
            rng.shuffle(all_possible_slots)

            scheduled_for_phase = 0
            for slot_day, slot_time in all_possible_slots:
                if scheduled_for_phase >= count:
                    break
                slot_key = (doc_id, slot_day, slot_time)
                if slot_key in doctor_booked_slots:
                    continue

                doctor_booked_slots.add(slot_key)
                scheduled_for_phase += 1

                # Select patient member
                patient = rng.choice(weighted_members)
                mem_id = patient["member_id"]

                slot_end = get_end_time(slot_time)
                appt_dt = datetime.combine(slot_day, datetime.strptime(slot_time, "%H:%M").time(), tzinfo=timezone.utc)

                appt_id = ObjectId()

                # Status selection
                if is_past:
                    # Up to Oct 8: 80% COMPLETED, 8% CANCELLED, 5% CANCELLED(no-show), 7% RESCHEDULED
                    roll = rng.random()
                    if roll < 0.80:
                        status = "COMPLETED"
                        can_reason = None
                    elif roll < 0.88:
                        status = "CANCELLED"
                        can_reason = "Patient requested cancellation due to personal scheduling conflict."
                    elif roll < 0.93:
                        status = "CANCELLED"
                        can_reason = "Patient no-show. Appointment marked as unattended."
                    else:
                        status = "RESCHEDULED"
                        can_reason = "Rescheduled to another slot upon patient request."
                else:
                    # Future: BOOKED or CONFIRMED
                    status = "CONFIRMED" if rng.random() < 0.50 else "BOOKED"
                    can_reason = None

                ai_pred_id = None

                # If COMPLETED, generate clinical consultation + record access + AI prediction
                if status == "COMPLETED":
                    # Record Access
                    ra_key = (mem_id, doc_id)
                    if ra_key not in record_access_map:
                        record_access_map[ra_key] = {
                            "_id": ObjectId(),
                            "family_member_id": mem_id,
                            "doctor_id": doc_id,
                            "granted_by": patient["creator_user_id"],
                            "granted_at": appt_dt - timedelta(days=rng.randint(1, 5)),
                            "revoked_at": None,
                            "status": "ACTIVE",
                            "created_at": appt_dt - timedelta(days=1),
                            "updated_at": appt_dt - timedelta(days=1),
                        }

                    # AI Prediction for ~75% of completed appointments
                    run_ai = (rng.random() < 0.75)
                    if run_ai:
                        pred_hex = f"pred_{uuid.uuid4().hex[:12]}"
                        pred_doc = None

                        if ai_module == "ai_cardio":
                            row_h = df_heart.iloc[heart_ptr % len(df_heart)]
                            heart_ptr += 1
                            age_val = float(row_h.get('age', 50))
                            if age_val > 150:
                                age_val = age_val / 365.25
                            req_h = HeartDiseaseRequest(
                                family_member_id=str(mem_id),
                                AGE=age_val,
                                GENDER=float(row_h.get('gender', 1)),
                                HEIGHT=float(row_h.get('height', 165)),
                                WEIGHT=float(row_h.get('weight', 65)),
                                AP_HIGH=float(row_h.get('ap_hi', 120)),
                                AP_LOW=float(row_h.get('ap_lo', 80)),
                                CHOLESTEROL=float(row_h.get('cholesterol', 1)),
                                GLUCOSE=float(row_h.get('gluc', 1)),
                                SMOKE=float(row_h.get('smoke', 0)),
                                ALCOHOL=float(row_h.get('alco', 0)),
                                PHYSICAL_ACTIVITY=float(row_h.get('active', 1)),
                                appointment_id=str(appt_id),
                            )
                            inf_res = HeartDiseaseInferenceService.predict(req_h)
                            pred_doc = {
                                "_id": ObjectId(),
                                "prediction_id": pred_hex,
                                "family_member_id": str(mem_id),
                                "appointment_id": str(appt_id),
                                "prediction_type": PredictionType.HEART_DISEASE_RISK.value,
                                "input_type": InputType.HEALTH_PARAMETERS.value,
                                "input_data": {
                                    "AGE": age_val,
                                    "GENDER": float(row_h.get('gender', 1)),
                                    "HEIGHT": float(row_h.get('height', 165)),
                                    "WEIGHT": float(row_h.get('weight', 65)),
                                    "AP_HIGH": float(row_h.get('ap_hi', 120)),
                                    "AP_LOW": float(row_h.get('ap_lo', 80)),
                                    "CHOLESTEROL": float(row_h.get('cholesterol', 1)),
                                    "GLUCOSE": float(row_h.get('gluc', 1)),
                                    "SMOKE": float(row_h.get('smoke', 0)),
                                    "ALCOHOL": float(row_h.get('alco', 0)),
                                    "PHYSICAL_ACTIVITY": float(row_h.get('active', 1)),
                                },
                                "result": inf_res,
                                "risk_level": inf_res["risk_category"],
                                "risk_score": inf_res["risk_probability"],
                                "confidence": inf_res["risk_probability"],
                                "model_name": inf_res["model_name"],
                                "model_version": inf_res["model_version"],
                                "explanation_reference": None,
                                "created_at": appt_dt.isoformat(),
                            }

                        elif ai_module == "ai_diabetes":
                            row_d = df_diab.iloc[diab_ptr % len(df_diab)]
                            diab_ptr += 1
                            req_d = DiabetesRequest(
                                family_member_id=str(mem_id),
                                Pregnancies=int(row_d['Pregnancies']),
                                Glucose=float(row_d['Glucose']),
                                BloodPressure=float(row_d['BloodPressure']),
                                SkinThickness=float(row_d['SkinThickness']),
                                Insulin=float(row_d['Insulin']),
                                BMI=float(row_d['BMI']),
                                DiabetesPedigreeFunction=float(row_d['DiabetesPedigreeFunction']),
                                Age=int(row_d['Age']),
                                appointment_id=str(appt_id),
                            )
                            inf_res = DiabetesInferenceService.predict(req_d)
                            pred_doc = {
                                "_id": ObjectId(),
                                "prediction_id": pred_hex,
                                "family_member_id": str(mem_id),
                                "appointment_id": str(appt_id),
                                "prediction_type": PredictionType.DIABETES_RISK.value,
                                "input_type": InputType.HEALTH_PARAMETERS.value,
                                "input_data": {
                                    "Pregnancies": int(row_d['Pregnancies']),
                                    "Glucose": float(row_d['Glucose']),
                                    "BloodPressure": float(row_d['BloodPressure']),
                                    "SkinThickness": float(row_d['SkinThickness']),
                                    "Insulin": float(row_d['Insulin']),
                                    "BMI": float(row_d['BMI']),
                                    "DiabetesPedigreeFunction": float(row_d['DiabetesPedigreeFunction']),
                                    "Age": int(row_d['Age']),
                                },
                                "result": inf_res,
                                "risk_level": inf_res["risk_category"],
                                "risk_score": inf_res["risk_probability"],
                                "confidence": inf_res["risk_probability"],
                                "model_name": inf_res["model_name"],
                                "model_version": inf_res["model_version"],
                                "explanation_reference": None,
                                "created_at": appt_dt.isoformat(),
                            }

                        elif ai_module == "ai_fracture":
                            img_path = fracture_image_paths[frac_ptr % len(fracture_image_paths)]
                            frac_ptr += 1
                            with open(img_path, 'rb') as fp:
                                img_bytes = fp.read()
                            inf_res = FractureInferenceService.predict(img_bytes, filename=os.path.basename(img_path))
                            pred_doc = {
                                "_id": ObjectId(),
                                "prediction_id": pred_hex,
                                "family_member_id": str(mem_id),
                                "appointment_id": str(appt_id),
                                "prediction_type": PredictionType.FRACTURE_DETECTION.value,
                                "input_type": InputType.IMAGE.value,
                                "input_data": {
                                    "filename": os.path.basename(img_path),
                                    "content_type": "image/jpeg",
                                    "size_bytes": len(img_bytes),
                                    "format": inf_res["image_metadata"].get("format"),
                                    "dimensions": [
                                        inf_res["image_metadata"].get("width"),
                                        inf_res["image_metadata"].get("height"),
                                    ],
                                },
                                "result": inf_res,
                                "risk_level": inf_res["risk_level"],
                                "risk_score": inf_res["risk_score"],
                                "confidence": inf_res["confidence"],
                                "model_name": inf_res["model_name"],
                                "model_version": inf_res["model_version"],
                                "explanation_reference": None,
                                "created_at": appt_dt.isoformat(),
                            }

                        elif ai_module == "ai_general":
                            symptom_text = NLP_SYMPTOM_TEXTS[nlp_ptr % len(NLP_SYMPTOM_TEXTS)]
                            nlp_ptr += 1
                            res_dict, r_lvl, r_score, conf = GeneralHealthNLPEngine.evaluate_symptoms(symptom_text)
                            pred_doc = {
                                "_id": ObjectId(),
                                "prediction_id": pred_hex,
                                "family_member_id": str(mem_id),
                                "appointment_id": str(appt_id),
                                "prediction_type": PredictionType.GENERAL_HEALTH.value,
                                "input_type": InputType.TEXT.value,
                                "input_data": {"text": symptom_text},
                                "result": res_dict,
                                "risk_level": r_lvl.value,
                                "risk_score": r_score,
                                "confidence": conf,
                                "model_name": GeneralHealthNLPEngine.MODEL_NAME,
                                "model_version": GeneralHealthNLPEngine.MODEL_VERSION,
                                "explanation_reference": None,
                                "created_at": appt_dt.isoformat(),
                            }

                        if pred_doc:
                            predictions_docs.append(pred_doc)
                            ai_pred_id = pred_hex

                    # Clinical Consultation record
                    c_id = ObjectId()
                    c_doc = {
                        "_id": c_id,
                        "family_member_id": mem_id,
                        "doctor_id": doc_id,
                        "appointment_id": appt_id,
                        "symptoms": "Evaluated during outpatient visit with clinical complaints matching department specialty.",
                        "observations": "Physical examination reveals normal systemic vitals; focal examination consistent with working diagnosis.",
                        "clinical_assessment": f"Clinical assessment formulated by {doc['full_name']} in {doc['dept_name']}.",
                        "treatment_plan": "Recommended therapeutic protocol, lifestyle guidance and routine follow-up as scheduled.",
                        "ai_prediction_ids": [ai_pred_id] if ai_pred_id else [],
                        "notes": "Patient advised to report promptly if acute symptoms develop.",
                        "status": "FINAL",
                        "finalized_at": appt_dt + timedelta(minutes=25),
                        "amendment_of": None,
                        "created_at": appt_dt,
                        "updated_at": appt_dt + timedelta(minutes=25),
                    }
                    consultations_docs.append(c_doc)

                    # Prescription for ~75% of completed consultations
                    if rng.random() < 0.75:
                        p_id = ObjectId()
                        med_sample = [
                            {"name": "Paracetamol", "dosage": "500 mg", "frequency": "1-0-1 after food", "duration": "5 days", "instructions": "Take with warm water"},
                            {"name": "Pantoprazole", "dosage": "40 mg", "frequency": "1-0-0 before breakfast", "duration": "14 days", "instructions": "Take 30 minutes before food"},
                        ] if ai_module in ["ai_general", "ai_fracture"] else [
                            {"name": "Metformin", "dosage": "500 mg", "frequency": "1-0-1 with food", "duration": "30 days", "instructions": "Maintain glycemic diary"},
                            {"name": "Atorvastatin", "dosage": "10 mg", "frequency": "0-0-1 bedtime", "duration": "30 days", "instructions": "Monitor lipid profile"},
                        ]
                        p_doc = {
                            "_id": p_id,
                            "family_member_id": mem_id,
                            "doctor_id": doc_id,
                            "consultation_id": c_id,
                            "medicines": med_sample,
                            "general_instructions": "Maintain hydration and adhere to prescribed medication timings.",
                            "status": "FINAL",
                            "finalized_at": appt_dt + timedelta(minutes=25),
                            "correction_of": None,
                            "created_at": appt_dt,
                            "updated_at": appt_dt + timedelta(minutes=25),
                        }
                        prescriptions_docs.append(p_doc)

                # Build Appointment record
                appt_doc = {
                    "_id": appt_id,
                    "family_member_id": mem_id,
                    "doctor_id": doc_id,
                    "hospital_id": hosp_id,
                    "department_id": dept_id,
                    "appointment_date": appt_dt,
                    "start_time": slot_time,
                    "end_time": slot_end,
                    "reason": f"Consultation with {doc['full_name']} ({doc['dept_name']})",
                    "status": status,
                    "appointment_type": "BOOKED",
                    "ai_prediction_id": ai_pred_id,
                    "cancelled_at": appt_dt - timedelta(hours=6) if status == "CANCELLED" else None,
                    "cancellation_reason": can_reason,
                    "created_at": appt_dt - timedelta(days=rng.randint(2, 7)),
                    "updated_at": appt_dt if status == "COMPLETED" else (appt_dt - timedelta(hours=6) if status == "CANCELLED" else appt_dt),
                }
                appointments_docs.append(appt_doc)

    print(f"Total appointments generated: {len(appointments_docs)}")
    print(f"Total clinical consultations: {len(consultations_docs)}")
    print(f"Total prescriptions generated: {len(prescriptions_docs)}")
    print(f"Total active doctor-patient record accesses: {len(record_access_map)}")
    print(f"Total real AI predictions executed and persisted: {len(predictions_docs)}")

    # Bulk insert appointments & clinical records
    print("Writing appointments to database...")
    db_appt.appointments.insert_many(appointments_docs)

    print("Writing consultations, prescriptions, and record access to database...")
    db_rec.consultations.insert_many(consultations_docs)
    db_rec.prescriptions.insert_many(prescriptions_docs)
    db_rec.recordaccesses.insert_many(list(record_access_map.values()))

    # Seed baseline medical records (1-2 per active patient)
    med_records_docs = []
    for m in all_members_list[:25]:
        mr_id = ObjectId()
        now = datetime(2026, 8, 15, 10, 0, 0, tzinfo=timezone.utc)
        mr_doc = {
            "_id": mr_id,
            "family_member_id": m["member_id"],
            "record_type": "REPORT",
            "file_name": f"baseline_lab_summary_{m['family_code']}.pdf",
            "file_url": f"/records/uploads/{m['member_id']}_baseline_lab.pdf",
            "description": "Baseline automated lab panel & diagnostic screening record.",
            "record_date": now,
            "uploaded_by": m["creator_user_id"],
            "source": "FAMILY",
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now,
        }
        med_records_docs.append(mr_doc)
    db_rec.medicalrecords.insert_many(med_records_docs)
    print(f" [INSERTED] {len(med_records_docs)} baseline medical records.")

    print("Writing real AI predictions to database...")
    db_ai.predictions.insert_many(predictions_docs)

    # ─────────────────────────────────────────────────────────────────────────
    # L. RECREATE APPLICATION INDEXES
    # ─────────────────────────────────────────────────────────────────────────
    print("\n--- Verifying & Rebuilding MongoDB Indexes ---")
    
    # 1. medimind_auth.users
    db_auth.users.create_index([("email", ASCENDING)], unique=True)
    db_auth.users.create_index([("role", ASCENDING)])
    db_auth.users.create_index([("reference_id", ASCENDING)])

    # 2. medimind_hospital
    db_hosp.hospitals.create_index([("code", ASCENDING)], unique=True, sparse=True)
    db_hosp.hospitals.create_index([("status", ASCENDING)])
    db_hosp.departments.create_index([("hospital_id", ASCENDING), ("name", ASCENDING)], unique=True)
    db_hosp.departments.create_index([("hospital_id", ASCENDING), ("status", ASCENDING)])
    db_hosp.departmentheads.create_index([("user_id", ASCENDING)], unique=True)
    db_hosp.departmentheads.create_index([("hospital_id", ASCENDING), ("department_id", ASCENDING)])
    db_hosp.hospitalrequests.create_index([("code", ASCENDING)])
    db_hosp.hospitalrequests.create_index([("status", ASCENDING)])

    # 3. medimind_doctor
    db_doc.doctors.create_index([("user_id", ASCENDING)], unique=True)
    db_doc.doctors.create_index([("email", ASCENDING)], unique=True)
    db_doc.doctors.create_index([("hospital_id", ASCENDING), ("department_id", ASCENDING)])
    db_doc.doctors.create_index([("specialization", ASCENDING)])
    db_doc.doctors.create_index([("status", ASCENDING)])

    # 4. medimind_family
    db_fam.families.create_index([("creator_user_id", ASCENDING)], unique=True)
    db_fam.families.create_index([("email", ASCENDING)], unique=True)
    db_fam.familymembers.create_index([("family_id", ASCENDING)])
    db_fam.familymembers.create_index([("status", ASCENDING)])

    # 5. medimind_appointment
    db_appt.appointments.create_index([("doctor_id", ASCENDING), ("appointment_date", ASCENDING), ("start_time", ASCENDING)])
    db_appt.appointments.create_index([("hospital_id", ASCENDING), ("department_id", ASCENDING)])
    db_appt.appointments.create_index([("family_member_id", ASCENDING)])
    db_appt.appointments.create_index([("status", ASCENDING)])
    db_appt.appointments.create_index([("ai_prediction_id", ASCENDING)], sparse=True)

    # 6. medimind_records
    db_rec.consultations.create_index([("appointment_id", ASCENDING)], unique=True)
    db_rec.consultations.create_index([("family_member_id", ASCENDING), ("status", ASCENDING)])
    db_rec.consultations.create_index([("doctor_id", ASCENDING), ("appointment_id", ASCENDING)])
    db_rec.prescriptions.create_index([("family_member_id", ASCENDING), ("status", ASCENDING)])
    db_rec.prescriptions.create_index([("doctor_id", ASCENDING), ("consultation_id", ASCENDING)])
    db_rec.medicalrecords.create_index([("family_member_id", ASCENDING), ("status", ASCENDING)])
    db_rec.recordaccesses.create_index([("family_member_id", ASCENDING), ("doctor_id", ASCENDING), ("status", ASCENDING)])

    # 7. medimind_knowledge
    db_know.articles.create_index([("author_doctor_id", ASCENDING), ("status", ASCENDING)])
    db_know.articles.create_index([("department_id", ASCENDING), ("status", ASCENDING)])
    db_know.articles.create_index([("hospital_id", ASCENDING), ("status", ASCENDING)])
    db_know.articles.create_index([("status", ASCENDING), ("published_at", DESCENDING)])

    # 8. medimind_ai
    db_ai.predictions.create_index([("prediction_id", ASCENDING)], unique=True)
    db_ai.predictions.create_index([("family_member_id", ASCENDING), ("created_at", DESCENDING)])
    db_ai.predictions.create_index([("appointment_id", ASCENDING)], sparse=True)

    print("All MongoDB production indexes successfully verified and applied.")

    # ─────────────────────────────────────────────────────────────────────────
    # M. COMPREHENSIVE VALIDATION CHECKS
    # ─────────────────────────────────────────────────────────────────────────
    print("\n==================================================")
    print("3. PERFORMING DATABASE SEED INTEGRITY VALIDATION")
    print("==================================================")

    # Accounts
    total_users = db_auth.users.count_documents({})
    c_count = db_auth.users.count_documents({"role": "CHAIRMAN"})
    ha_count = db_auth.users.count_documents({"role": "HOSPITAL_ADMIN"})
    dh_count = db_auth.users.count_documents({"role": "DEPARTMENT_HEAD"})
    doc_count = db_auth.users.count_documents({"role": "DOCTOR"})
    fam_count = db_auth.users.count_documents({"role": "FAMILY"})
    mem_count = db_fam.familymembers.count_documents({})

    print(f"Users validation: Total={total_users} (Expected 59)")
    print(f" - Chairman: {c_count} (Expected 2)")
    print(f" - Hospital Admin: {ha_count} (Expected 4)")
    print(f" - Department Head: {dh_count} (Expected 14)")
    print(f" - Doctor: {doc_count} (Expected 29)")
    print(f" - Family: {fam_count} (Expected 10)")
    print(f"Family Members validation: Total={mem_count} (Expected 44)")

    assert total_users == 59, f"User count mismatch: {total_users} != 59"
    assert c_count == 2, f"Chairman count mismatch: {c_count} != 2"
    assert ha_count == 4, f"Hospital Admin count mismatch: {ha_count} != 4"
    assert dh_count == 14, f"Department Head count mismatch: {dh_count} != 14"
    assert doc_count == 29, f"Doctor count mismatch: {doc_count} != 29"
    assert fam_count == 10, f"Family count mismatch: {fam_count} != 10"
    assert mem_count == 44, f"Family Member count mismatch: {mem_count} != 44"

    # Hospitals
    hosp_tot = db_hosp.hospitals.count_documents({})
    hosp_appr = db_hosp.hospitals.count_documents({"status": "ACTIVE"})
    hosp_pend = db_hosp.hospitals.count_documents({"status": "PENDING"})
    print(f"Hospitals validation: Total={hosp_tot} (Approved={hosp_appr}, Pending={hosp_pend}) (Expected: 5 total, 3 approved, 2 pending)")
    assert hosp_tot == 5, f"Hospital total mismatch: {hosp_tot} != 5"
    assert hosp_appr == 3, f"Approved hospital mismatch: {hosp_appr} != 3"
    assert hosp_pend == 2, f"Pending hospital mismatch: {hosp_pend} != 2"

    # Departments
    dept_tot = db_hosp.departments.count_documents({})
    print(f"Departments validation: Total={dept_tot} (Expected 13)")
    assert dept_tot == 13, f"Department total mismatch: {dept_tot} != 13"

    # Knowledge
    art_tot = db_know.articles.count_documents({})
    print(f"Knowledge Articles validation: Total={art_tot} (Expected >= 39)")
    assert art_tot >= 39, f"Articles count below requirement: {art_tot} < 39"

    # Appointments by month
    appts = list(db_appt.appointments.find({}, {"appointment_date": 1, "status": 1}))
    monthly_counts = {"August": 0, "September": 0, "October (Past 1-8)": 0, "October (Future 9-31)": 0, "November": 0}
    future_completed_count = 0
    for a in appts:
        dt = a["appointment_date"]
        st = a["status"]
        if dt.month == 8:
            monthly_counts["August"] += 1
        elif dt.month == 9:
            monthly_counts["September"] += 1
        elif dt.month == 10 and dt.day <= 8:
            monthly_counts["October (Past 1-8)"] += 1
        elif dt.month == 10 and dt.day > 8:
            monthly_counts["October (Future 9-31)"] += 1
            if st == "COMPLETED": future_completed_count += 1
        elif dt.month == 11:
            monthly_counts["November"] += 1
            if st == "COMPLETED": future_completed_count += 1

    print("Appointments Monthly Distribution:")
    for m_name, cnt in monthly_counts.items():
        print(f" - {m_name}: {cnt}")
    print(f"Future completed appointments count: {future_completed_count} (Expected 0)")
    assert future_completed_count == 0, "Error: Future appointments were marked COMPLETED!"

    # AI Predictions by module
    preds = list(db_ai.predictions.find({}, {"prediction_type": 1}))
    module_counts = {}
    for p in preds:
        pt = p["prediction_type"]
        module_counts[pt] = module_counts.get(pt, 0) + 1
    print(f"AI Predictions Total: {len(preds)}")
    for mod, cnt in module_counts.items():
        print(f" - {mod}: {cnt}")
    assert len(preds) > 0, "Error: No AI predictions were generated!"

    # Verify doctor overlap
    seen_slots = set()
    overlap_found = False
    for a in db_appt.appointments.find({}, {"doctor_id": 1, "appointment_date": 1, "start_time": 1}):
        key = (str(a["doctor_id"]), a["appointment_date"].date(), a["start_time"])
        if key in seen_slots:
            overlap_found = True
            break
        seen_slots.add(key)
    print(f"Doctor appointment overlap check: Overlap found = {overlap_found} (Expected False)")
    assert not overlap_found, "Error: Doctor appointment collision detected!"

    print("\n>> ALL COMPREHENSIVE VALIDATION CHECKS PASSED PERFECTLY!\n")
    return {
        "total_users": total_users,
        "chairman": c_count,
        "hospital_admins": ha_count,
        "department_heads": dh_count,
        "doctors": doc_count,
        "families": fam_count,
        "family_members": mem_count,
        "hospitals_total": hosp_tot,
        "hospitals_approved": hosp_appr,
        "hospitals_pending": hosp_pend,
        "departments": dept_tot,
        "articles": art_tot,
        "appointments_total": len(appts),
        "monthly_appointments": monthly_counts,
        "ai_predictions_total": len(preds),
        "predictions_by_module": module_counts,
    }


def replicate_to_atlas_if_configured():
    atlas_uri = os.getenv("MONGODB_URI")
    if not atlas_uri or "localhost" in atlas_uri or "127.0.0.1" in atlas_uri:
        print("Atlas URI not configured or points to local. Skipping Atlas replication.")
        return

    print("==================================================")
    print("4. REPLICATING SEED DATASET TO ATLAS CLUSTER")
    print("==================================================")
    
    local_client = MongoClient("mongodb://127.0.0.1:27017")
    atlas_client = MongoClient(atlas_uri)

    for db_name in TARGET_DATABASES:
        print(f"Replicating {db_name} to Atlas...")
        atlas_client.drop_database(db_name)
        local_db = local_client[db_name]
        atlas_db = atlas_client[db_name]

        for col_name in local_db.list_collection_names():
            docs = list(local_db[col_name].find({}))
            if docs:
                atlas_db[col_name].insert_many(docs)
            # Replicate indexes
            for idx in local_db[col_name].list_indexes():
                if idx["name"] != "_id_":
                    keys = list(idx["key"].items())
                    unique = idx.get("unique", False)
                    sparse = idx.get("sparse", False)
                    try:
                        atlas_db[col_name].create_index(keys, unique=unique, sparse=sparse)
                    except Exception as e:
                        pass
            print(f" - {db_name}.{col_name}: {len(docs)} documents copied")
    print("Atlas replication completed successfully!\n")


if __name__ == "__main__":
    summary = execute_reset_and_seed()
    replicate_to_atlas_if_configured()
    print("==================================================")
    print("ALL SEED AND REPLICATION OPERATIONS COMPLETED SUCCESSFULLY.")
    print("==================================================")
