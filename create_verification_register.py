"""
create_verification_register.py
Builds MediMind_Numerical_Verification_Register.xlsx containing comprehensive
numerical and fact verification across the entire MediMind project.
Enhanced with a dynamic Summary & Reconciliation sheet containing live Excel formulas.
"""

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def create_register():
    wb = openpyxl.Workbook()
    
    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 1: Master Numerical Verification Register
    # ─────────────────────────────────────────────────────────────────────────
    ws = wb.active
    ws.title = "Numerical Verification Register"
    ws.views.sheetView[0].showGridLines = True

    # Title block
    ws.merge_cells("A1:H1")
    title_cell = ws["A1"]
    title_cell.value = "MediMind: Master Numerical Verification Register & Fact Audit"
    title_cell.font = Font(name="Calibri", size=16, bold=True, color="17365D")
    title_cell.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[1].height = 30

    ws.merge_cells("A2:H2")
    sub_cell = ws["A2"]
    sub_cell.value = "Audited against actual repository source code, manifests, model checkpoints, training logs, and Phase 20 integration reports."
    sub_cell.font = Font(name="Calibri", size=10, italic=True, color="555555")
    sub_cell.alignment = Alignment(horizontal="left", vertical="center")
    ws.row_dimensions[2].height = 20

    # Header Row
    headers = [
        "Phase / Section",
        "Parameter / Metric",
        "Value in Original Document",
        "Verified Value",
        "Evidence Source",
        "Verification Status",
        "Correction Made",
        "Audit Notes & Context"
    ]
    
    header_fill = PatternFill(start_color="17365D", end_color="17365D", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    thin_border = Border(
        left=Side(style='thin', color='D3D3D3'),
        right=Side(style='thin', color='D3D3D3'),
        top=Side(style='thin', color='D3D3D3'),
        bottom=Side(style='thin', color='D3D3D3')
    )

    ws.append([]) # Row 3 empty
    ws.row_dimensions[3].height = 10
    
    header_row = 4
    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=header_row, column=col_idx, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border
    ws.row_dimensions[header_row].height = 28

    # Data Rows (Exactly 99 parameters)
    records = [
        # Phase 1
        ("Phase 1: 1.6", "Cardiovascular Recall Safety Floor", ">= 80.0%", ">= 80.0% (target), >= 75.0% (floor)", "prediction_schemas.py, HEART_DISEASE_DATASET.md", "VERIFIED & ACCURATE", "None (Preserved)", "Verified against analytical KPI contract."),
        ("Phase 1: 1.6", "Diabetes Recall Safety Floor", ">= 80.0%", ">= 80.0% (target), >= 75.0% (floor)", "prediction_schemas.py, DIABETES_DATASET.md", "VERIFIED & ACCURATE", "None (Preserved)", "Verified against analytical KPI contract."),
        ("Phase 1: 1.6", "Musculoskeletal Fracture Sensitivity Floor", ">= 95.0%", ">= 95.0% (target), >= 90.0% (floor)", "prediction_schemas.py, FRACTURE_DATASET.md", "VERIFIED & ACCURATE", "None (Preserved)", "Verified against clinical trauma screening floor."),
        ("Phase 1: 1.6", "Expected Calibration Error Target", "< 0.100", "< 0.100", "training_report.json (HD, DB, Fracture)", "VERIFIED & ACCURATE", "None (Preserved)", "Primary target for probability reliability."),

        # Phase 2
        ("Phase 2: 2.2", "Cardiovascular Raw Record Count", "68,783", "68,783", "cardiovascular_diseases_dv3.csv", "VERIFIED & ACCURATE", "None (Preserved)", "Matches raw survey file row count."),
        ("Phase 2: 2.2", "Pima Diabetes Total Records", "768", "768", "diabetes.csv, training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches NIDDK Pima dataset dimensions."),
        ("Phase 2: 2.2", "FracAtlas Total Images", "4,083", "4,083", "FracAtlas dataset manifest", "VERIFIED & ACCURATE", "None (Preserved)", "Matches CC BY 4.0 benchmark archive."),
        ("Phase 2: 2.2", "MURA Total Studies / Radiographs", "14,863 studies / 40,561 images", "14,863 studies / 40,561 images", "MURA v1.1 dataset publication", "VERIFIED & ACCURATE", "None (Preserved)", "Stanford ML Group archive benchmark."),
        ("Phase 2: 2.2", "MURA Subset Used in Pretraining", "2,869 radiographs", "2,869 radiographs", "ai-prediction-service/artifacts/fracture/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Samples used during ResNet-18 pretraining."),
        ("Phase 2: 2.2", "GRAZPEDWRI-DX Total Archive Studies", "3,388 unique studies", "3,388 studies (6,420 radiographs)", "dataset_cleaning_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Total pediatric wrist trauma archive."),
        ("Phase 2: 2.2", "GRAZPEDWRI-DX Paired Studies (Exp 8A)", "2,318 paired studies", "2,318 paired studies (4,636 radiographs)", "EXPERIMENT_8A_FREEZE_MANIFEST.json", "CORRECTED & RECONCILED", "Updated paired count", "1,620 train + 348 val + 350 test = 2,318 studies."),
        ("Phase 2: 2.2", "Shenzhen PediURF Studies / Images", "1,053 studies / 2,106 images", "1,053 studies / 2,106 images", "experiment8a_pediurf_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Paired AP and Lateral trauma projections."),
        ("Phase 2: 2.2", "Normal Pediatric Controls Stress Cohort", "251 normal images", "251 normal radiographs", "experiment8a_normal_control_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Dedicated normal pediatric controls with open physis."),

        # Phase 3
        ("Phase 3: 3.2.1", "Cardiovascular Cryptographic Duplicate Rows", "3,820 rows", "3,820 rows across 2,602 clusters", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "MD5/SHA row hashing identified exact duplicates."),
        ("Phase 3: 3.2.1", "Cardiovascular Cleaned Cohort Count", "64,963 records", "64,963 records", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "68,783 raw - 3,820 duplicates = 64,963 clean."),
        ("Phase 3: 3.2.1", "Cardiovascular Duplicates Class Balance", "2,832 Class 0 / 988 Class 1", "2,832 Class 0 (74.14%) / 988 Class 1 (25.86%)", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Disproportionately concentrated in negative class."),
        ("Phase 3: 3.2.1", "Cardiovascular Deduplicated Class Balance", "31,910 Class 0 / 33,053 Class 1", "31,910 Class 0 (49.12%) / 33,053 Class 1 (50.88%)", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Evenly balanced after deduplication."),
        ("Phase 3: 3.2.2", "Cardiovascular Train Split Count", "45,474 records", "45,474 (22,337 Class 0, 23,137 Class 1)", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Exact 70% stratified split."),
        ("Phase 3: 3.2.2", "Cardiovascular Validation Split Count", "9,744 records", "9,744 (4,786 Class 0, 4,958 Class 1)", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Exact 15% stratified split."),
        ("Phase 3: 3.2.2", "Cardiovascular Test Split Count", "9,745 records", "9,745 (4,787 Class 0, 4,958 Class 1)", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Exact 15% stratified split."),
        ("Phase 3: 3.3.1", "Diabetes Biological Zero: Glucose", "5 zeros (0.65%)", "5 zeros (0.65%)", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Physiological zero impossible in living patient."),
        ("Phase 3: 3.3.1", "Diabetes Biological Zero: BloodPressure", "35 zeros (4.56%)", "35 zeros (4.56%)", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Physiological zero impossible in living patient."),
        ("Phase 3: 3.3.1", "Diabetes Biological Zero: SkinThickness", "227 zeros (29.56%)", "227 zeros (29.56%)", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Omission in skinfold measurement."),
        ("Phase 3: 3.3.1", "Diabetes Biological Zero: Insulin", "374 zeros (48.70%)", "374 zeros (48.70%)", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Omission in 2-hour serum insulin challenge."),
        ("Phase 3: 3.3.1", "Diabetes Biological Zero: BMI", "11 zeros (1.43%)", "11 zeros (1.43%)", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Omission in height/weight recording."),
        ("Phase 3: 3.3.2", "Diabetes Imputation Median: Glucose", "117.0 mg/dL", "117.0 mg/dL", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Fitted strictly on 537 training records."),
        ("Phase 3: 3.3.2", "Diabetes Imputation Median: BloodPressure", "72.0 mmHg", "72.0 mmHg", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Fitted strictly on 537 training records."),
        ("Phase 3: 3.3.2", "Diabetes Imputation Median: SkinThickness", "29.0 mm", "29.0 mm", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Fitted strictly on 537 training records."),
        ("Phase 3: 3.3.2", "Diabetes Imputation Median: Insulin", "125.0 mu U/mL (in some text)", "126.0 mu U/mL", "artifacts/diabetes/training_report.json", "CORRECTED & RECONCILED", "Corrected 125.0 to 126.0", "training_report.json records exact median 126.0."),
        ("Phase 3: 3.3.2", "Diabetes Imputation Median: BMI", "32.3 kg/m^2 (in some text)", "32.4 kg/m^2", "artifacts/diabetes/training_report.json", "CORRECTED & RECONCILED", "Corrected 32.3 to 32.4", "training_report.json records exact median 32.4."),
        ("Phase 3: 3.3.2", "Diabetes Train/Val/Test Split Sizes", "537 / 115 / 116 records", "537 / 115 / 116 records", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Train: 350 Cl 0, 187 Cl 1; Val: 75/40; Test: 75/41."),
        ("Phase 3: 3.4.3", "GRAZPEDWRI-DX Exp 8A Training Studies", "1,620 paired studies", "1,620 paired studies (1,122 fx, 498 normal)", "EXPERIMENT_8A_FREEZE_MANIFEST.json", "VERIFIED & ACCURATE", "None (Preserved)", "Study-level isolation enforced."),
        ("Phase 3: 3.4.3", "GRAZPEDWRI-DX Exp 8A Validation Studies", "348 paired studies", "348 paired studies (242 fx, 106 normal)", "EXPERIMENT_8A_FREEZE_MANIFEST.json", "VERIFIED & ACCURATE", "None (Preserved)", "Study-level isolation enforced."),
        ("Phase 3: 3.4.3", "GRAZPEDWRI-DX Exp 8A Test Studies", "350 paired studies", "350 paired studies (249 fx, 101 normal)", "EXPERIMENT_8A_FREEZE_MANIFEST.json", "VERIFIED & ACCURATE", "None (Preserved)", "Study-level isolation enforced."),

        # Phase 6
        ("Phase 6: 6.2", "Cardiovascular Random Forest Val Recall (tau=0.5)", "69.20%", "69.20% (rec: 0.6920, spec: 0.7668)", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Baseline threshold 0.50 evaluation."),
        ("Phase 6: 6.2", "Cardiovascular Random Forest Val ROC-AUC", "0.7944", "0.7944", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Validation ROC-AUC."),
        ("Phase 6: 6.3", "Cardiovascular Random Forest Tuned Threshold", "tau = 0.4000", "tau = 0.4000", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Selected via validation recall >= 80% sweep."),
        ("Phase 6: 6.7", "Cardiovascular Random Forest Test Recall (tau=0.4)", "80.01%", "80.01% (3,967 / 4,958)", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Satisfies clinical sensitivity floor."),
        ("Phase 6: 6.7", "Cardiovascular Random Forest Test Specificity", "63.40%", "63.40% (3,035 / 4,787)", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Controlled trade-off for sensitivity gain."),
        ("Phase 6: 6.7", "Cardiovascular Random Forest Test Precision", "67.43% (in some text)", "69.37%", "artifacts/heart_disease/training_report.json", "CORRECTED & RECONCILED", "Corrected 67.43% to 69.37%", "Precision = 3967 / (3967 + 1752) = 69.37%."),
        ("Phase 6: 6.7", "Cardiovascular Random Forest Test NPV", "77.01%", "77.01%", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "NPV = 3035 / (3035 + 991) = 77.01%."),
        ("Phase 6: 6.7", "Cardiovascular Random Forest Test ROC-AUC", "0.7961", "0.7961", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches final test evaluation."),
        ("Phase 6: 6.7", "Cardiovascular Random Forest Test PR-AUC", "0.7835", "0.7835", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches final test evaluation."),
        ("Phase 6: 6.7", "Cardiovascular Random Forest Test Brier Score", "0.1829", "0.1829", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches final test evaluation."),
        ("Phase 6: 6.7", "Cardiovascular Random Forest ECE", "0.0080", "0.00796 (< 0.8% error)", "artifacts/heart_disease/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Outstanding calibration across deciles."),
        ("Phase 6: 6.3", "Diabetes MLP Tuned Operating Threshold", "tau = 0.2500", "tau = 0.2500", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Selected via validation recall >= 80% sweep."),
        ("Phase 6: 6.7", "Diabetes MLP Test Recall (tau=0.25)", "80.49%", "80.49% (33 / 41)", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Satisfies clinical sensitivity floor."),
        ("Phase 6: 6.7", "Diabetes MLP Test Specificity (tau=0.25)", "68.00%", "68.00% (51 / 75)", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches final test evaluation."),
        ("Phase 6: 6.7", "Diabetes MLP Test Precision (tau=0.25)", "57.89%", "57.89% (33 / 57)", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches final test evaluation."),
        ("Phase 6: 6.7", "Diabetes MLP Test NPV (tau=0.25)", "86.44%", "86.44% (51 / 59)", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches final test evaluation."),
        ("Phase 6: 6.7", "Diabetes MLP Test ROC-AUC", "0.8267", "0.8267", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches final test evaluation."),
        ("Phase 6: 6.7", "Diabetes MLP Test PR-AUC", "0.7205", "0.7205", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches final test evaluation."),
        ("Phase 6: 6.7", "Diabetes MLP Test Brier Score", "0.1647", "0.1647", "artifacts/diabetes/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches final test evaluation."),
        ("Phase 6: 6.7", "Diabetes MLP Test ECE", "0.1037", "0.1037", "artifacts/diabetes/training_report.json", "LIMITATION DISCLOSED", "Disclosed calibration limit", "Slightly exceeds 0.100 target; noted in audit."),
        ("Phase 6: 6.7", "Fracture Baseline ResNet-18 Test Recall (tau=0.18)", "96.26%", "96.26% (103 / 107)", "artifacts/fracture/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Production baseline on held-out FracAtlas."),
        ("Phase 6: 6.7", "Fracture Baseline ResNet-18 Test Specificity", "63.64%", "63.64% (322 / 506)", "artifacts/fracture/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches test confusion matrix."),
        ("Phase 6: 6.7", "Fracture Baseline ResNet-18 Test Precision", "35.40% (in some text)", "35.89%", "artifacts/fracture/training_report.json", "CORRECTED & RECONCILED", "Corrected 35.40% to 35.89%", "TP=103, FP=184 -> 103/287 = 35.89%."),
        ("Phase 6: 6.7", "Fracture Baseline ResNet-18 Test NPV", "98.66% (in some text)", "98.77%", "artifacts/fracture/training_report.json", "CORRECTED & RECONCILED", "Corrected 98.66% to 98.77%", "TN=322, FN=4 -> 322/326 = 98.77%."),
        ("Phase 6: 6.7", "Fracture Baseline ResNet-18 Test ROC-AUC", "0.9244", "0.9244", "artifacts/fracture/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches test report."),
        ("Phase 6: 6.7", "Fracture Baseline ResNet-18 Test PR-AUC", "0.7843", "0.7843", "artifacts/fracture/training_report.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches test report."),
        ("Phase 6: 6.7", "Fracture Baseline ResNet-18 Test ECE", "0.1021", "0.1021", "artifacts/fracture/training_report.json", "LIMITATION DISCLOSED", "Disclosed calibration limit", "Slightly exceeds 0.100 target; noted in audit."),
        ("Phase 6: 6.7", "Fracture Exp 8A Test Sensitivity (tau=0.01)", "95.18%", "95.18% (237 / 249)", "experiment8a_graz_test_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Research candidate on GRAZ held-out test."),
        ("Phase 6: 6.7", "Fracture Exp 8A Test Specificity", "75.25%", "75.25% (76 / 101)", "experiment8a_graz_test_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Research candidate on GRAZ held-out test."),
        ("Phase 6: 6.7", "Fracture Exp 8A Test Precision", "90.46%", "90.46% (237 / 262)", "experiment8a_graz_test_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches test report."),
        ("Phase 6: 6.7", "Fracture Exp 8A Test NPV", "86.36%", "86.36% (76 / 88)", "experiment8a_graz_test_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches test report."),
        ("Phase 6: 6.7", "Fracture Exp 8A Test ROC-AUC", "0.9586", "0.9586", "experiment8a_graz_test_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches test report."),
        ("Phase 6: 6.7", "Fracture Exp 8A Test PR-AUC", "0.9860", "0.9860", "experiment8a_graz_test_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches test report."),
        ("Phase 6: 6.7", "Fracture Exp 8A Test Brier Score", "0.0811", "0.0811", "experiment8a_graz_test_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches test report."),
        ("Phase 6: 6.7", "Fracture Exp 8A Test ECE", "0.0897", "0.0897", "experiment8a_graz_test_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Satisfies primary calibration target (< 0.100)."),

        # Phase 7
        ("Phase 7: 7.3", "Exp 8A Orthogonal Lateral Rescues", "24 lateral rescues", "24 lateral-only rescues", "EXPERIMENT_8A_FREEZE_MANIFEST.json", "VERIFIED & ACCURATE", "None (Preserved)", "Fractures occult on AP view rescued on Lateral."),
        ("Phase 7: 7.3", "Exp 8A Multi-View State A (Dual Detected)", "198 studies (in older text)", "207 / 207 fractured studies (100.0%)", "EXPERIMENT_8A_FREEZE_MANIFEST.json", "CORRECTED & RECONCILED", "Corrected 198 to 207", "Matches verified freeze manifest state breakdown."),
        ("Phase 7: 7.3", "Exp 8A Multi-View State B (AP Only Detected)", "20 studies (in older text)", "6 / 6 fractured studies (100.0%)", "EXPERIMENT_8A_FREEZE_MANIFEST.json", "CORRECTED & RECONCILED", "Corrected 20 to 6", "Matches verified freeze manifest state breakdown."),
        ("Phase 7: 7.3", "Exp 8A Multi-View State C (Lateral Only Rescue)", "24 studies", "24 / 24 fractured studies (100.0%)", "EXPERIMENT_8A_FREEZE_MANIFEST.json", "VERIFIED & ACCURATE", "None (Preserved)", "Matches verified freeze manifest state breakdown."),
        ("Phase 7: 7.3", "Exp 8A Multi-View State D (Zero Detected / Miss)", "12 studies", "12 / 12 fractured studies (0.0% detected)", "EXPERIMENT_8A_FREEZE_MANIFEST.json", "VERIFIED & ACCURATE", "None (Preserved)", "Subtle non-displaced torus lesions below threshold."),
        ("Phase 7: 7.4", "Exp 8A Normal Control Specificity", "87.25%", "87.25% (219 / 251 TN)", "experiment8a_normal_control_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Tested on uncorrupted normal pediatric controls."),
        ("Phase 7: 7.5", "Shenzhen PediURF Total Trauma Studies", "1,053 studies", "1,053 studies (2,106 images)", "experiment8a_pediurf_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "External benchmark from Shenzhen Children's Hospital."),
        ("Phase 7: 7.5", "Shenzhen Overall Study Sensitivity", "94.59%", "94.59% (996 / 1,053)", "experiment8a_pediurf_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "996 TP / 57 FN on external test."),
        ("Phase 7: 7.5", "Shenzhen Distal Subgroup Studies / Sensitivity", "767 studies (in older text)", "677 studies; 632 TP / 45 FN -> 93.35%", "experiment8a_pediurf_results.json", "CORRECTED & RECONCILED", "Corrected 767 to 677", "Verified subgroup denominator."),
        ("Phase 7: 7.5", "Shenzhen Midshaft Subgroup Studies / Sensitivity", "203 studies (in older text)", "265 studies; 259 TP / 6 FN -> 97.74%", "experiment8a_pediurf_results.json", "CORRECTED & RECONCILED", "Corrected 203 to 265", "Verified subgroup denominator."),
        ("Phase 7: 7.5", "Shenzhen Proximal Subgroup Studies / Sensitivity", "83 studies (in older text)", "111 studies; 105 TP / 6 FN -> 94.59%", "experiment8a_pediurf_results.json", "CORRECTED & RECONCILED", "Corrected 83 to 111", "Verified subgroup denominator."),

        # Section 8
        ("Section 8: 8.3", "SOA Ecosystem Endpoints", "10 endpoints", "10 endpoints (8 microservices + 1 gateway + 1 frontend)", "MediMind_Phase20_Architecture_and_Integration_Audit.md", "VERIFIED & ACCURATE", "None (Preserved)", "Audited ports 5000-5008, 5173."),
        ("Section 8: 8.3", "Middleware Services", "Eureka (8761), Kafka (9092), MongoDB (27017)", "Eureka (8761), Kafka (9092), MongoDB Atlas", "Phase 20 service architecture", "VERIFIED & ACCURATE", "None (Preserved)", "Service discovery and event streaming."),
        ("Section 8: 8.8", "Phase 20 Automated Test Checks", "128 / 128", "127 automated test assertions + 1 build check", "MediMind_Phase20_Test_Evidence.md", "VERIFIED & ACCURATE", "None (Preserved)", "69 Pytest + 58 Node.js/E2E + 1 Vite build = 128 total."),
        ("Section 8: 8.8", "AI Prediction Pytest Suite", "69 tests / 69 passed", "69 tests / 69 passed (100% pass)", "ai-prediction-service/tests/ test log", "VERIFIED & ACCURATE", "None (Preserved)", "Executed via Pytest in Phase 20 audit."),
        ("Section 8: 8.8", "Frontend Production Build Time", "373 ms (Vite v8.3.0)", "373 ms (2,007 modules transformed)", "Phase 20 frontend build log", "VERIFIED & ACCURATE", "None (Preserved)", "Zero syntax or bundling errors."),

        # Section 10
        ("Section 10: 10.1", "Total Historical Clinical Appointments", "5,009", "5,009", "MongoDB medimind_appointment collection", "VERIFIED & ACCURATE", "None (Preserved)", "Database invariant: 4,727 due + 282 future."),
        ("Section 10: 10.1", "Genuine October 2026 Scheduled Volume", "741", "741", "October demonstration view manifest", "VERIFIED & ACCURATE", "None (Preserved)", "Locked historical demonstration baseline."),
        ("Section 10: 10.1", "November Advance Scheduled Volume", "330", "330", "November demonstration view manifest", "VERIFIED & ACCURATE", "None (Preserved)", "Locked advance booking workload."),
        ("Section 10: 10.1", "Unresolved Due Workload (November 4)", "345", "345", "MongoDB query on due appointments", "VERIFIED & ACCURATE", "None (Preserved)", "Preserved genuine clinical operations."),
        ("Section 10: 10.1", "Total Network Review Queue Items", "274", "274", "Platform owner review queue query", "VERIFIED & ACCURATE", "None (Preserved)", "Reconciled clinical review items."),
        ("Section 10: 10.1", "Aarogyam Hospital Unclosed Items", "64", "64", "Hospital admin tenant-isolated view", "VERIFIED & ACCURATE", "None (Preserved)", "Tenant isolation verification."),
        ("Section 10: 10.1", "Dr. Rahul Sharma Assigned Encounters", "3", "3", "Doctor tenant-isolated view", "VERIFIED & ACCURATE", "None (Preserved)", "Doctor role scoping verification."),
        ("Section 10: 10.1", "MongoDB Document Collections Count", "8 collections", "8 collections", "MongoDB Atlas medimind_* collections", "VERIFIED & ACCURATE", "None (Preserved)", "Verified document collections."),
        ("Section 10: 10.1", "Standalone Clinical NLP Predictions", "90 or 167", "167 in medimind_ai.predictions (90 historical baseline)", "MongoDB medimind_ai query", "VERIFIED & ACCURATE", "None (Preserved)", "Disambiguated baseline vs total records."),
        ("Section 10: 10.2", "Demonstration Baseline Total Workload", "1,128", "741 genuine October + 387 staging fixtures = 1,128", "OctoberDemonstrationView.jsx", "VERIFIED & ACCURATE", "None (Preserved)", "Separates genuine operations from fixtures."),
        ("Section 10: 10.2", "October Staging In-Memory Fixtures", "387", "387 synthetic demonstration appointments", "test_october_demonstration_dashboard.mjs", "VERIFIED & ACCURATE", "None (Preserved)", "Demonstration staging reconciliation."),
        ("Section 10: 10.2", "Staging Fixtures Class Breakdown", "65 Walk-in / 322 Direct Bookings", "65 Walk-in / 322 Direct Bookings", "Synthetic staging fixture manifest", "VERIFIED & ACCURATE", "None (Preserved)", "Preserves genuine database isolation."),
        ("Section 10: 10.3", "API Gateway End-to-End Latency", "28.2 ms warm median", "28.2 ms warm median (p95 = 41.36 ms)", "scripts/benchmark_results.json", "VERIFIED & ACCURATE", "None (Preserved)", "Warm paginated endpoint response latency."),
        ("Section 10: 10.3", "Raw Per-Model Inference Latency Isolation", "[DATA NEEDED placeholder in draft]", "Not independently isolated", "Benchmark analysis & scripts/benchmark_results.json", "DOCUMENTED CAVEAT", "Replaced placeholder with caveat", "Documented explicitly as methodological caveat.")
    ]

    fill_verified = PatternFill(start_color="EAF2D3", end_color="EAF2D3", fill_type="solid") # Light Green
    fill_corrected = PatternFill(start_color="FCE4D6", end_color="FCE4D6", fill_type="solid") # Light Orange
    fill_limit = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid") # Light Yellow
    fill_caveat = PatternFill(start_color="EDF2F8", end_color="EDF2F8", fill_type="solid") # Light Blue

    font_data = Font(name="Calibri", size=9.5)
    font_bold = Font(name="Calibri", size=9.5, bold=True)

    for row_idx, rec in enumerate(records, start=5):
        status = rec[5]
        if status == "VERIFIED & ACCURATE":
            status_fill = fill_verified
        elif status == "CORRECTED & RECONCILED":
            status_fill = fill_corrected
        elif status == "LIMITATION DISCLOSED":
            status_fill = fill_limit
        else:
            status_fill = fill_caveat

        for col_idx, val in enumerate(rec, start=1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_bold if col_idx in [1, 2, 6] else font_data
            cell.border = thin_border
            cell.alignment = Alignment(
                horizontal="center" if col_idx in [1, 6] else "left",
                vertical="center",
                wrap_text=True
            )
            if col_idx == 6:
                cell.fill = status_fill
        ws.row_dimensions[row_idx].height = 24

    # Column Widths for Register
    col_widths = {
        "A": 16, # Phase / Section
        "B": 36, # Parameter / Metric
        "C": 26, # Value in Original Document
        "D": 38, # Verified Value
        "E": 34, # Evidence Source
        "F": 25, # Verification Status
        "G": 30, # Correction Made
        "H": 45  # Audit Notes & Context
    }
    for col_letter, width in col_widths.items():
        ws.column_dimensions[col_letter].width = width

    # ─────────────────────────────────────────────────────────────────────────
    # SHEET 2: Summary & Reconciliation (With Live Formulas)
    # ─────────────────────────────────────────────────────────────────────────
    ws_sum = wb.create_sheet(title="Audit Summary & Reconciliation")
    ws_sum.views.sheetView[0].showGridLines = True

    # Title block
    ws_sum.merge_cells("A1:E1")
    s_title = ws_sum["A1"]
    s_title.value = "MediMind: Verification Status Summary & Formula Reconciliation"
    s_title.font = Font(name="Calibri", size=15, bold=True, color="17365D")
    s_title.alignment = Alignment(horizontal="left", vertical="center")
    ws_sum.row_dimensions[1].height = 28

    ws_sum.merge_cells("A2:E2")
    s_sub = ws_sum["A2"]
    s_sub.value = "Automated statistical breakdown across all 99 audited parameters calculated directly via live Excel formulas."
    s_sub.font = Font(name="Calibri", size=10, italic=True, color="555555")
    s_sub.alignment = Alignment(horizontal="left", vertical="center")
    ws_sum.row_dimensions[2].height = 18

    # Table 1: Status Classification Summary
    ws_sum.cell(row=4, column=1, value="Classification Category").fill = header_fill
    ws_sum.cell(row=4, column=1).font = header_font
    ws_sum.cell(row=4, column=2, value="Count (Formula)").fill = header_fill
    ws_sum.cell(row=4, column=2).font = header_font
    ws_sum.cell(row=4, column=3, value="Percentage (Formula)").fill = header_fill
    ws_sum.cell(row=4, column=3).font = header_font
    ws_sum.cell(row=4, column=4, value="Description & Academic Interpretation").fill = header_fill
    ws_sum.cell(row=4, column=4).font = header_font
    ws_sum.row_dimensions[4].height = 24

    sum_rows = [
        ("Verified & Accurate", "=COUNTIF('Numerical Verification Register'!F5:F103, \"VERIFIED & ACCURATE\")", "=B5/B9", "Original claim strictly confirmed by repository ground truth with 0 discrepancy.", fill_verified),
        ("Corrected & Reconciled", "=COUNTIF('Numerical Verification Register'!F5:F103, \"CORRECTED & RECONCILED\")", "=B6/B9", "Numerical discrepancy corrected against verified training report or freeze manifest.", fill_corrected),
        ("Methodological Limitation Disclosed", "=COUNTIF('Numerical Verification Register'!F5:F103, \"LIMITATION DISCLOSED\")", "=B7/B9", "Parameter exceeds target threshold (e.g., ECE > 0.100); transparently disclosed in text.", fill_limit),
        ("Documented Caveat", "=COUNTIF('Numerical Verification Register'!F5:F103, \"DOCUMENTED CAVEAT\")", "=B8/B9", "Claim cannot be isolated on micro-level; replaced with measured system-level caveat.", fill_caveat),
        ("Total Audited Parameters", "=SUM(B5:B8)", "=SUM(C5:C8)", "Exhaustive audit register encompassing all numerical claims across 14 sections.", header_fill)
    ]

    for idx, (cat, f_cnt, f_pct, desc, fill_style) in enumerate(sum_rows, start=5):
        c1 = ws_sum.cell(row=idx, column=1, value=cat)
        c2 = ws_sum.cell(row=idx, column=2, value=f_cnt)
        c3 = ws_sum.cell(row=idx, column=3, value=f_pct)
        c4 = ws_sum.cell(row=idx, column=4, value=desc)
        
        is_total = (idx == 9)
        c_font = Font(name="Calibri", size=10, bold=is_total, color="FFFFFF" if is_total else "000000")
        for c in [c1, c2, c3, c4]:
            c.font = c_font
            c.border = thin_border
            c.fill = fill_style if is_total else PatternFill(fill_type=None)
        
        c1.alignment = Alignment(horizontal="left", vertical="center")
        c2.alignment = Alignment(horizontal="center", vertical="center")
        c3.alignment = Alignment(horizontal="center", vertical="center")
        c3.number_format = '0.0%'
        c4.alignment = Alignment(horizontal="left", vertical="center")
        ws_sum.row_dimensions[idx].height = 22

    # Table 2: Phase Breakdown
    ws_sum.cell(row=12, column=1, value="Data Science Lifecycle Phase").fill = header_fill
    ws_sum.cell(row=12, column=1).font = header_font
    ws_sum.cell(row=12, column=2, value="Parameters Audited").fill = header_fill
    ws_sum.cell(row=12, column=2).font = header_font
    ws_sum.cell(row=12, column=3, value="Audited Focus Area").fill = header_fill
    ws_sum.cell(row=12, column=3).font = header_font
    ws_sum.row_dimensions[12].height = 24

    phase_rows = [
        ("Phase 1: Problem Identification", "=COUNTIF('Numerical Verification Register'!A5:A103, \"Phase 1*\")", "Clinical framing, sensitivity floors (>=80%, >=90%), calibration target (<0.100)."),
        ("Phase 2: Data Collection & Integration", "=COUNTIF('Numerical Verification Register'!A5:A103, \"Phase 2*\")", "Raw dataset dimensions (68k Cardio, 768 Pima, 4k FracAtlas, 3.3k GRAZ, 1k PediURF)."),
        ("Phase 3: Data Preparation & Hygiene", "=COUNTIF('Numerical Verification Register'!A5:A103, \"Phase 3*\")", "Duplicate removal (-3,820), 70/15/15 splits, biological zeros, train imputation medians."),
        ("Phase 6: Model Building & Comparison", "=COUNTIF('Numerical Verification Register'!A5:A103, \"Phase 6*\")", "Validation sweeps (tau=0.40, 0.25, 0.18, 0.01), master test evaluations (Sens, Spec, ECE)."),
        ("Phase 7: Clinical Evaluation & Interpretation", "=COUNTIF('Numerical Verification Register'!A5:A103, \"Phase 7*\")", "24 lateral rescues, normal controls (87.25% spec), Shenzhen PediURF (94.59% sens)."),
        ("Section 8: Architecture & Phase 20 SOA", "=COUNTIF('Numerical Verification Register'!A5:A103, \"Section 8*\")", "10-service SOA topology, Eureka/Kafka ports, 128/128 passed integration tests."),
        ("Section 10: Operational Reconciliation", "=COUNTIF('Numerical Verification Register'!A5:A103, \"Section 10*\")", "5,009 database invariants, 741 genuine October vs 387 staging demonstration fixtures."),
        ("Total Audited Parameters Across Phases", "=SUM(B13:B19)", "Matches master count of 99 individually verified metrics.")
    ]

    for idx, (p_name, f_val, p_desc) in enumerate(phase_rows, start=13):
        c1 = ws_sum.cell(row=idx, column=1, value=p_name)
        c2 = ws_sum.cell(row=idx, column=2, value=f_val)
        c3 = ws_sum.cell(row=idx, column=3, value=p_desc)
        
        is_total = (idx == 20)
        c_font = Font(name="Calibri", size=10, bold=is_total, color="FFFFFF" if is_total else "000000")
        for c in [c1, c2, c3]:
            c.font = c_font
            c.border = thin_border
            if is_total:
                c.fill = header_fill
        
        c1.alignment = Alignment(horizontal="left", vertical="center")
        c2.alignment = Alignment(horizontal="center", vertical="center")
        c3.alignment = Alignment(horizontal="left", vertical="center")
        ws_sum.row_dimensions[idx].height = 22

    # Column Widths for Summary
    ws_sum.column_dimensions["A"].width = 38
    ws_sum.column_dimensions["B"].width = 24
    ws_sum.column_dimensions["C"].width = 24
    ws_sum.column_dimensions["D"].width = 65
    ws_sum.column_dimensions["E"].width = 15

    output_path = "MediMind_Numerical_Verification_Register.xlsx"
    wb.save(output_path)
    print(f"Successfully generated {output_path} with 99 verified records and live formula reconciliation sheet!")

if __name__ == "__main__":
    create_register()
