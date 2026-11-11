"""
build_case_study.py
Generates MediMind_DL_DS_Case_Study_v2.docx adhering to:
1. Structural template: AI_Age_Transformation_Case_Study_GUIDE.docx (7 phases, week ranges, tools, deliverables, pipeline, serving, ethics, demo, assessment summary, student statement, insights, governance, references).
2. Deep learning and data science scope (classical ML benchmarks vs DL, dual-view ROI fusion, YOLOv8 localization, ResNet-18, calibration, leakage prevention, asymmetric loss, 95% Wilson CIs).
3. Hard rules: NO invented data. Exact repo figures only. Transparent [DATA NEEDED] placeholders.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_document():
    doc = docx.Document()

    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Styles Setup
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(10.5)
    normal_style.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(4)

    # Helper Functions
    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(20)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x17, 0x36, 0x5D)
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(11.5)
        run.font.color.rgb = RGBColor(0x4F, 0x81, 0xBD)
        return p

    def add_meta(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(16)
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(9.5)
        run.font.italic = True
        run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x36, 0x5F, 0x91)
        return p

    def add_phase_header(phase_name, weeks_str):
        p1 = add_h1(phase_name)
        p2 = doc.add_paragraph()
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(6)
        p2.paragraph_format.keep_with_next = True
        run = p2.add_run(weeks_str)
        run.font.name = 'Calibri'
        run.font.size = Pt(10.5)
        run.font.bold = True
        run.font.italic = True
        run.font.color.rgb = RGBColor(0x4F, 0x81, 0xBD)
        return p1

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(12)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x4F, 0x81, 0xBD)
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(10.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x17, 0x36, 0x5D)
        return p

    def add_p(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(text)
        run.font.name = 'Calibri'
        run.font.size = Pt(10.5)
        return p

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        r1 = p.add_run(bold_prefix)
        r1.font.bold = True
        r1.font.color.rgb = RGBColor(0x17, 0x36, 0x5D)
        r2 = p.add_run(" " + text)
        return p

    def add_callout(text, prefix="Methodological Note: "):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        set_cell_background(cell, "F0F4F8")
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:left w:val="single" w:sz="24" w:space="0" w:color="365F91"/>'
            f'<w:top w:val="none"/>'
            f'<w:right w:val="none"/>'
            f'<w:bottom w:val="none"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        r_pre = p.add_run(prefix)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(0x36, 0x5F, 0x91)
        r_text = p.add_run(text)
        r_text.font.italic = True
        doc.add_paragraph().paragraph_format.space_after = Pt(2)

    def add_styled_table(headers, rows_data, col_widths=None):
        table = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(table, "D3D3D3")
        
        # Header Row
        hdr_cells = table.rows[0].cells
        for col_idx, header_text in enumerate(headers):
            hdr_cells[col_idx].text = header_text
            set_cell_background(hdr_cells[col_idx], "365F91")
            set_cell_margins(hdr_cells[col_idx], top=100, bottom=100, left=120, right=120)
            p = hdr_cells[col_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = 'Calibri'
                r.font.size = Pt(9.5)
                r.font.bold = True
                r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        
        # Data Rows
        for row_idx, row_values in enumerate(rows_data):
            row_cells = table.rows[row_idx + 1].cells
            bg_color = "F2F5F9" if row_idx % 2 == 1 else "FFFFFF"
            for col_idx, val in enumerate(row_values):
                row_cells[col_idx].text = str(val)
                set_cell_background(row_cells[col_idx], bg_color)
                set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=120, right=120)
                p = row_cells[col_idx].paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for r in p.runs:
                    r.font.name = 'Calibri'
                    r.font.size = Pt(9.0)
                    r.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
        
        # Apply Column Widths if provided
        if col_widths:
            for row in table.rows:
                for idx, width in enumerate(col_widths):
                    row.cells[idx].width = width
                    
        p_space = doc.add_paragraph()
        p_space.paragraph_format.space_after = Pt(4)
        return table

    def add_image_figure(img_path, caption, width_in=6.0):
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(6)
            p_img.paragraph_format.space_after = Pt(2)
            run = p_img.add_run()
            run.add_picture(img_path, width=Inches(width_in))
            
            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(0)
            p_cap.paragraph_format.space_after = Pt(8)
            r_cap = p_cap.add_run(caption)
            r_cap.font.name = 'Calibri'
            r_cap.font.size = Pt(8.5)
            r_cap.font.italic = True
            r_cap.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    print("Building Document Sections...")

    # ─────────────────────────────────────────────────────────────────────────
    # TITLE & HEADER
    # ─────────────────────────────────────────────────────────────────────────
    add_title("MediMind: A 12-Week Industry-Oriented Deep Learning and Data Science Case Study in Clinical Risk Analytics")
    add_subtitle("End-to-End Multi-Modal Machine Learning, Leakage Prevention, Localized Multi-View Fusion, and Calibrated Decision Support")
    add_meta("Academic Year 2026–2027  |  Department of Data Science & Artificial Intelligence  |  Repository Baseline: feature/medimind-soa-demo / experiment8-multiview-localized-fusion")

    # ─────────────────────────────────────────────────────────────────────────
    # EXECUTIVE SUMMARY
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("Executive Summary: The Data Science Paradigm in Healthcare")
    add_p("Modern clinical predictive modeling faces a severe translational bottleneck: while highly parameterized machine learning architectures frequently achieve near-perfect cross-validation scores on public benchmarks, they routinely fail when confronted with out-of-distribution clinical workflows. In healthcare data science, algorithmic complexity is fundamentally subordinate to data hygiene, patient-level leakage prevention, representation fidelity, and probabilistic calibration. An uncalibrated deep neural network trained on leaked patient records is not merely ineffective—it is an active hazard in an acute triage environment.")
    add_p("The MediMind project embodies a rigorous, end-to-end Data Science lifecycle developed across 12 structured weeks. MediMind investigates three clinical predictive risk modeling tasks: (1) cardiovascular disease risk prediction from observational hemodynamic cohorts (64,963 clean records); (2) diabetes mellitus risk prediction from metabolic biomarkers (768 patient records); and (3) acute musculoskeletal fracture detection from plain radiographs across adult and pediatric populations (FracAtlas, MURA, GRAZPEDWRI-DX, and Shenzhen PediURF).")
    add_p("This academic case study documents how disciplined data science principles governed every phase of development: excising 3,820 duplicate patient records to eliminate optimistic test set inflation; implementing train-only median biological zero imputation to prevent lookahead leakage; discovering and formalizing pediatric epiphyseal growth plates as anatomical false-positive confounders; transitioning through a 4-stage computer vision progression from global whole-image classifiers to localized Region-of-Interest (ROI) multi-view fusion; tuning decision thresholds under asymmetric clinical cost functions ($C_{\text{FN}} \gg C_{\text{FP}}$); computing rigorous 95% Wilson confidence intervals; and validating generalization across an untouched external cohort of 1,053 pediatric trauma studies from Shenzhen Children's Hospital.")

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 1 — PROBLEM IDENTIFICATION (Weeks 1–2)
    # ─────────────────────────────────────────────────────────────────────────
    add_phase_header("Phase 1 — Problem Identification", "Weeks 1–2  |  Clinical Problem Formulation, Asymmetric Loss & Risk Governance")
    
    add_h2("1.1 Project Title")
    add_p("MediMind: Multi-Modal Data Science and Deep Learning Framework for Calibrated Clinical Decision Support in Outpatient and Emergency Healthcare Risk Stratification.")

    add_h2("1.2 Problem Statement")
    add_p("Develop an evidence-based clinical risk analytics framework that accepts routine physiological measurements, metabolic lab panels, and multi-view musculoskeletal radiographs to output calibrated posterior risk probabilities and localized anatomical bounding boxes. The system must operate strictly as a clinical decision-support aid (CDSS) that prioritizes sensitivity / recall ($\ge 80\%$ for tabular screening, $\ge 90\%$ for acute trauma) while maintaining transparent probabilistic calibration (Expected Calibration Error $< 0.10$) and rigorous patient-level data isolation.")

    add_h2("1.3 Example Input, Target, and Expected Output")
    add_p("To illustrate the translational boundary across analytical domains, Table 1.1 formalizes the operational mapping from patient inputs to model predictions.")
    
    headers_t1 = ["Clinical Domain", "Input Modality & Raw Features", "Ground Truth Target", "Calibrated Output & Decision Support"]
    rows_t1 = [
        ["Cardiovascular Risk", "11 Hemodynamic & lifestyle features (Age, Blood Pressure, BMI, Cholesterol, Glucose, Vitals)", "Physician-confirmed CVD event (0 = No, 1 = Yes)", "Posterior probability P(CVD=1|X), risk tier, hemodynamic factor attribution at tau = 0.4000"],
        ["Diabetes Risk", "8 Metabolic features (2-hr OGTT Glucose, Insulin, BMI, Blood Pressure, Skinfold, Age, Pedigree)", "Diagnostic diabetes outcome (0 = Non-diabetic, 1 = Diabetic)", "Posterior probability P(Diabetes=1|X), metabolic warning flags at tuned tau = 0.2500"],
        ["Fracture Detection", "Paired digital radiographs (Anteroposterior [AP] + Lateral wrist projections; 512x512)", "Radiologist consensus cortical bone disruption", "Multi-view localized bounding boxes, late-fusion probability P(Fracture=1|I) at tau = 0.0100"],
        ["Deterministic Safety Triage", "Unconstrained natural language clinical triage chief complaint vignette", "Expert clinical emergency escalation tier", "Rule-based non-learned safety classification: Emergency, Urgent, Moderate, or Routine"]
    ]
    add_styled_table(headers_t1, rows_t1, [Inches(1.3), Inches(2.2), Inches(1.5), Inches(2.0)])

    add_h2("1.4 Industry Problem & Clinical Translational Bottleneck")
    add_p("Across clinical settings, diagnostic errors represent a leading cause of preventable patient morbidity and malpractice claims. In emergency departments, missed acute fractures during overnight shifts frequently stem from cognitive fatigue, visual distraction, and the subtlety of non-displaced pediatric injuries. In outpatient care, cardiovascular and metabolic diseases progress silently for years before clinical presentation. However, translating machine learning into healthcare encounters four severe bottlenecks: (1) silent data leakage where overlapping patient records artificially inflate test scores; (2) representational confusion where deep models latch onto anatomical confounders (such as open pediatric growth plates); (3) threshold mismatch where default 0.50 decision thresholds discard clinical utility; and (4) probability miscalibration where predicted risk scores do not match real-world event frequencies.")

    add_h2("1.5 Stakeholders & Clinical Governance Boundaries")
    add_p("Predictive healthcare models do not exist in isolation; they serve distinct institutional user personas with conflicting requirements and governance constraints, as summarized in Table 1.2.")
    
    headers_t2 = ["Stakeholder Persona", "Operational Role & Governance Requirement"]
    rows_t2 = [
        ["Attending Physician / Clinician", "Direct diagnostic decision-maker requiring calibrated probabilities, transparent factor attribution, visual lesion bounding boxes, and rapid inference (< 150 ms) without autonomous overrides."],
        ["Department Head / Radiologist", "Clinical quality assurance lead auditing false-positive referral burdens, pediatric growth plate confusion rates, and departmental sensitivity floors."],
        ["Chief Medical Officer (CMO)", "Institutional safety officer enforcing strict non-diagnostic positioning, demographic bias auditing, and regulatory compliance (HIPAA / GDPR / FDA SaMD)."],
        ["Hospital Administrator & SRE", "System reliability officer monitoring API throughput, zero-downtime microservice health, and cryptographic checkpoint lineage."],
        ["Patient & Family", "Health-literate consumers requiring clear, non-alarmist risk tier explanations that reinforce that algorithmic scores require licensed clinical confirmation."]
    ]
    add_styled_table(headers_t2, rows_t2, [Inches(2.2), Inches(4.8)])

    add_h2("1.6 Objectives")
    add_bullet("Epidemiological Hygiene:", "Eliminate data contamination by purging 3,820 duplicate rows and enforcing train-only parameter fitting across all preprocessing steps.")
    add_bullet("Pediatric Confounder Resolution:", "Formally solve the catastrophic growth plate false-positive failure of global CNNs by developing localized spatial ROI late-fusion deep architectures.")
    add_bullet("Multi-View Synergy:", "Demonstrate that orthogonal radiographic views (Lateral rescues) capture occult fractures invisible on standard Anteroposterior views.")
    add_bullet("Asymmetric Loss Optimization:", "Decouple decision thresholds from the default 0.50 cutoff to satisfy clinical recall floors (>= 80% tabular, >= 90% trauma).")
    add_bullet("External Generalization:", "Validate model robustness across diverse international patient populations and imaging equipment via external evaluation on the Shenzhen PediURF cohort.")

    add_h2("1.7 Proposed KPIs & Asymmetric Clinical Loss Formulation")
    add_p("In clinical diagnostic screening, the costs of classification errors are radically asymmetric. A False Negative (FN)—failing to detect an acute bone fracture or latent coronary risk—delays critical treatment, risking permanent physical impairment or fatal myocardial infarction. Conversely, a False Positive (FP) generates clinician review time or secondary confirmatory testing. Consequently, the clinical loss function is governed by:")
    add_callout(
        "L_clinical(y, y_hat) = C_FN * I(y = 1, y_hat = 0) + C_FP * I(y = 0, y_hat = 1), where C_FN >> C_FP.",
        prefix="Clinical Cost Asymmetry Formulation: "
    )
    add_p("Because disease prevalence in screening cohorts is frequently skewed, overall Accuracy is mathematically invalid as a primary KPI: a naive classifier predicting 'healthy' for every patient achieves 82.4% accuracy on FracAtlas while missing 100% of fractures. MediMind establishes the following rigorous KPI hierarchy:")
    
    headers_t3 = ["KPI Category", "Governing Metric", "Mathematical Formulation", "Target Clinical Floor"]
    rows_t3 = [
        ["Diagnostic Safety", "Recall / Sensitivity", "TP / (TP + FN)", ">= 80.0% (Tabular), >= 90.0% (Radiography)"],
        ["Clinical Efficiency", "Specificity", "TN / (TN + FP)", ">= 60.0% (Tabular), >= 70.0% (Radiography)"],
        ["Positive Reliability", "Precision / PPV", "TP / (TP + FP)", "Monitored under class imbalance; maximized subject to recall floor"],
        ["Negative Reliability", "NPV", "TN / (TN + FN)", ">= 85.0% to provide high confidence when ruling out pathology"],
        ["Discrimination", "PR-AUC & ROC-AUC", "Integral of Precision(Recall) & TPR(FPR)", "PR-AUC prioritized over ROC-AUC in skewed cohorts"],
        ["Probabilistic Trust", "Expected Calibration Error", "Sum_m (|B_m|/N) * |acc(B_m) - conf(B_m)|", "ECE < 0.10; Brier Score < 0.20 across all modules"]
    ]
    add_styled_table(headers_t3, rows_t3, [Inches(1.5), Inches(1.5), Inches(2.2), Inches(1.8)])

    add_h2("1.8 Deliverables")
    add_p("Phase 1 establishes the formal analytical problem definition, stakeholder matrix, asymmetric cost formulation, and KPI targets. Deliverables are mapped directly to repository artifacts: problem formulation specifications in ai-prediction-service/app/schemas/prediction_schemas.py, and initial baseline configurations in ai-prediction-service/app/models/heart_disease/HEART_DISEASE_DATASET.md and ai-prediction-service/app/models/diabetes/DIABETES_DATASET.md.")

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 2 — DATA COLLECTION & INTEGRATION (Weeks 3–4)
    # ─────────────────────────────────────────────────────────────────────────
    add_phase_header("Phase 2 — Data Collection & Integration", "Weeks 3–4  |  Multi-Modal Clinical Schemas, Provenance Audits & Dataset Isolation")

    add_h2("2.1 Objective")
    add_p("Identify, acquire, audit, and integrate multi-modal clinical datasets spanning structured tabular hemodynamics, metabolic biomarkers, adult musculoskeletal radiographs, and pediatric wrist trauma studies. Establish cryptographic checksums and enforce strict isolation between research benchmarks and production deployment sets.")

    add_h2("2.2 Data Sources & Multi-Modal Clinical Provenance")
    add_bullet("Cardiovascular Disease Survey (DV3):", "Observational epidemiological registry containing 68,783 raw patient records across 11 hemodynamic, anthropometric, and lifestyle features. Target: binary cardiovascular disease occurrence (0 = 34,742; 1 = 34,041).")
    add_bullet("Pima Indians Diabetes Database:", "National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK / UCI Repository). 768 patient records documenting female Pima Indians aged >= 21 years across 8 diagnostic biomarkers. Target: diabetes diagnosis (0 = 500; 1 = 268).")
    add_bullet("Stanford MURA v1.1:", "Musculoskeletal Radiographs archive (Rajpurkar et al., Stanford ML Group). 2,869 upper-extremity radiographic studies utilized exclusively for initial feature backbone representation pretraining.")
    add_bullet("FracAtlas Musculoskeletal Archive:", "Peer-reviewed bone fracture dataset (Nature Scientific Data 10, 521, 2023; DOI: 10.1038/s41597-023-02432-4). 4,083 raw images (4,068 valid after deduplication) spanning hand, leg, hip, and shoulder radiographs (715 fractured = 17.58%; 3,353 non-fractured = 82.42%). Partitioned into 2,425 baseline images under a 1,200 training sample budget.")
    add_bullet("GRAZPEDWRI-DX Pediatric Wrist Archive:", "Public pediatric wrist trauma dataset (Nagy et al., Scientific Data 9, 444, 2022; DOI: 10.1038/s41597-022-01528-6) containing 20,327 raw radiographs from 6,091 patients. Due to disk and compute constraints, a canonical subset of 5,031 radiographs (1,499 unique patients; 3,334 fractured = 66.27%, 1,697 non-fractured = 33.73%) was extracted, yielding 251 normal images in the test split.")
    add_bullet("Shenzhen PediURF External Validation Cohort:", "Pediatric Ulna and Radius Fractures archive from Shenzhen Children's Hospital (Figshare DOI: 10.6084/m9.figshare.29998954). 1,053 paired AP and Lateral wrist studies (2,106 images) used exclusively as an independent, untouched external evaluation cohort. The cohort consists entirely of fracture-positive pediatric trauma cases.")

    add_h2("2.3 Tabular Data Schemas & Feature Dictionaries")
    add_p("Table 2.1 documents the 11 raw numeric features of the cardiovascular dataset, while Table 2.2 documents the 8 diagnostic features of the Pima diabetes dataset.")
    
    headers_t4 = ["Feature Name", "Data Type", "Observed Range", "Clinical & Pathophysiological Interpretation"]
    rows_t4 = [
        ["AGE", "Continuous", "30.0 – 65.0 yrs", "Patient age in years; primary non-modifiable risk factor for arterial stiffening."],
        ["GENDER", "Categorical", "1: Fem, 2: Male", "Biological sex (65.0% female, 35.0% male in cohort)."],
        ["HEIGHT", "Continuous", "55.0 – 250.0 cm", "Anthropometric height; used in body mass and hemodynamic surface calculations."],
        ["WEIGHT", "Continuous", "11.0 – 200.0 kg", "Anthropometric weight; indicator of adiposity and cardiac preload burden."],
        ["AP_HIGH", "Continuous", "60.0 – 240.0 mmHg", "Systolic arterial blood pressure; direct measure of peak left-ventricular pressure."],
        ["AP_LOW", "Continuous", "40.0 – 190.0 mmHg", "Diastolic arterial blood pressure; reflection of systemic vascular resistance."],
        ["CHOLESTEROL", "Ordinal", "1: Norm, 2: High, 3: VHigh", "Serum cholesterol biomarker; primary biochemical driver of atherogenesis."],
        ["GLUCOSE", "Ordinal", "1: Norm, 2: High, 3: VHigh", "Serum glucose category; marker of glycemic dysfunction and vascular risk."],
        ["SMOKE", "Binary", "0: No, 1: Yes", "Active tobacco smoking status; major contributor to endothelial dysfunction."],
        ["ALCOHOL", "Binary", "0: No, 1: Yes", "Regular alcohol intake; lifestyle modulator of blood pressure and cardiomyopathy."],
        ["PHYSICAL_ACTIVITY", "Binary", "0: No, 1: Yes", "Regular physical exercise; cardioprotective factor improving endothelial tone."]
    ]
    add_styled_table(headers_t4, rows_t4, [Inches(1.5), Inches(1.0), Inches(1.5), Inches(3.0)])

    headers_t5 = ["Feature Name", "Data Type", "Zeros (Missing)", "Clinical Diagnostic Measurement Context"]
    rows_t5 = [
        ["Pregnancies", "Integer", "111 (Valid 0)", "Number of completed pregnancies; physiological marker of gestational stress."],
        ["Glucose", "Continuous", "5 (0.65%)", "Plasma glucose concentration at 2 hours in an oral glucose tolerance test (OGTT)."],
        ["BloodPressure", "Continuous", "35 (4.56%)", "Diastolic arterial blood pressure in mmHg; proxy for resting vascular tone."],
        ["SkinThickness", "Continuous", "227 (29.56%)", "Triceps skinfold thickness in mm; anthropometric fat store estimate."],
        ["Insulin", "Continuous", "374 (48.70%)", "2-hour serum insulin in mu U/ml; indicator of pancreatic beta-cell reserve."],
        ["BMI", "Continuous", "11 (1.43%)", "Body mass index (weight in kg / height in m^2); primary obesity indicator."],
        ["DiabetesPedigree", "Continuous", "0 (None)", "Genetic diabetes pedigree function score based on family medical history."],
        ["Age", "Continuous", "0 (None)", "Age in years (cohort constrained to females aged >= 21 years)."]
    ]
    add_styled_table(headers_t5, rows_t5, [Inches(1.5), Inches(1.0), Inches(1.3), Inches(3.2)])

    add_h2("2.4 Integrated Multi-Modal Dataset Landscape")
    add_p("Table 2.3 summarizes the integrated dataset landscape across all modalities, including sample counts, class balance, and partition sizes.")
    
    headers_t6 = ["Dataset & Modality", "Raw Dimension", "Clean / Filtered", "Train Split", "Validation Split", "Test Split", "Primary Role"]
    rows_t6 = [
        ["Cardiovascular (Tabular)", "68,783 rows", "64,963 clean rows", "45,474 (70%)", "9,744 (15%)", "9,745 (15%)", "Production Hemodynamic Model"],
        ["Pima Diabetes (Tabular)", "768 rows", "768 rows (imputed)", "537 (70%)", "115 (15%)", "116 (15%)", "Production Metabolic Model (Small Cohort)"],
        ["Stanford MURA (X-ray)", "2,869 images", "2,869 images", "2,869 (pretrain)", "—", "—", "Feature Backbone Pretraining"],
        ["FracAtlas (X-ray)", "4,083 images", "4,068 valid (2,425 base)", "1,200 (train)", "612 (val)", "613 (test)", "Production Single-View Baseline"],
        ["GRAZPEDWRI-DX (X-ray)", "20,327 raw", "5,031 extracted (1,499 pts)", "3,522 (train)", "740 (val)", "769 (test; 251 norm)", "Pediatric Research & Stress Test"],
        ["Exp 8A Paired Studies", "2,318 studies", "2,318 paired studies", "1,620 studies", "348 studies", "350 studies (700 imgs)", "Research Dual-View Localized Fusion"],
        ["Shenzhen PediURF", "1,053 studies", "1,053 paired studies", "—", "—", "1,053 studies (2,106 imgs)", "Untouched External Validation (100% Pos)"]
    ]
    add_styled_table(headers_t6, rows_t6, [Inches(1.5), Inches(0.9), Inches(1.3), Inches(0.9), Inches(0.8), Inches(1.1), Inches(1.5)])

    add_h2("2.5 Data Integration Tasks & Cohort Isolation")
    add_bullet("Zero-Copy Filesystem Auditing:", "Verified all local radiograph paths and DICOM/PNG headers without physical file duplication to prevent inode exhaustion.")
    add_bullet("Provenance Verification:", "Validated institutional origin, ethics board approvals, and Creative Commons licensing (FracAtlas CC BY 4.0; GRAZPEDWRI-DX CC BY 4.0; PediURF Figshare CC BY 4.0).")
    add_bullet("Strict Cohort Isolation:", "Shenzhen PediURF was physically quarantined from training and validation scripts to guarantee zero cross-contamination.")

    add_h2("2.6 Tools")
    add_p("Python 3.14, Pandas 2.2, NumPy 1.26, Pillow 10.4, OpenCV 4.10, PyTorch 2.14+cpu, scikit-learn 1.9, and SHA-256 cryptographic hashing utilities.")

    add_h2("2.7 Deliverables")
    add_p("Cleaned dataset manifests and audit logs: ai-prediction-service/artifacts/fracture_v2/manifests/dataset_cleaning_report.json, ai-prediction-service/artifacts/fracture_v2/graz_only/manifests/dataset_cleaning_report.json, and ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8_dataset_statistics.json.")

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 3 — DATA PREPARATION (Weeks 5–6)
    # ─────────────────────────────────────────────────────────────────────────
    add_phase_header("Phase 3 — Data Preparation", "Weeks 5–6  |  Deduplication, Missing-Value Imputation & Leakage Elimination")

    add_h2("3.1 Objective")
    add_p("Purge duplicate patient records, resolve biological zero values without target contamination, enforce strict patient-level and study-level radiograph partitioning, and isolate data augmentations to prevent optimistic performance inflation.")

    add_h2("3.2 Data Quality Checks & Exact Duplicate Excision (-3,820 rows)")
    add_p("In clinical data registries, patient readmissions, duplicate survey uploads, and repeated intake registrations frequently generate identical records. If an un-deduplicated dataset is randomly partitioned, identical patient records land in both training and test folds. This creates severe data leakage: the model memorizes idiosyncratic patient feature combinations, producing artificially inflated test scores that collapse in deployment.")
    add_p("In the cardiovascular dataset (cardiovascular_diseases_dv3.csv), cryptographic row hashing identified exactly 3,820 duplicate rows across 2,602 duplicate clusters. Purging these duplicate records reduced the cohort from 68,783 to 64,963 clean records ($68,783 - 3,820 = 64,963$). Class balance in the removed duplicate subset was 2,832 negative (Class 0) and 988 positive (Class 1), demonstrating that duplicate inflation was disproportionately concentrated in the negative class. Following deduplication, stratified 70/15/15 splitting produced 45,474 training rows, 9,744 validation rows, and 9,745 held-out test rows.")
    add_callout(
        "[DATA NEEDED: empirical model metrics on un-deduplicated cardiovascular cohort; searched in artifacts/heart_disease/ and artifacts/experiments/]. The repository code enforces deduplication prior to partitioning, and no model was trained on the un-deduplicated dataset. Consequently, while duplicate removal is a foundational data science requirement, claims of measured empirical test score drop are framed as methodological principles.",
        prefix="Data Gap & Provenance Log: "
    )

    add_h2("3.3 Missing Data Mechanisms & Biological Zero Imputation in Diabetes (Train-Only Medians)")
    add_p("In the Pima Indians Diabetes Database, missing biomarker values were historically encoded as numerical zero. While a pregnancy count of zero is physiologically valid, zero values for Glucose (5 records), Diastolic Blood Pressure (35 records), Triceps Skinfold Thickness (227 records), 2-hour Serum Insulin (374 records), and BMI (11 records) are biologically impossible in living patients. Treating these as true zeros corrupts gradient descent, skewing feature standardizations and decision trees.")
    add_p("To resolve this without data leakage, biological zeros were converted to NaN and imputed using column medians. In strict compliance with leakage prevention, imputation medians were fitted exclusively on the training partition ($N = 537$) and then applied downstream to validation ($N = 115$) and test ($N = 116$) partitions:")
    add_bullet("Glucose Median:", "117.0 mg/dL (computed on non-zero training values; applied to 5 missing rows).")
    add_bullet("Blood Pressure Median:", "72.0 mmHg (computed on non-zero training values; applied to 35 missing rows).")
    add_bullet("Skin Thickness Median:", "29.0 mm (computed on non-zero training values; applied to 227 missing rows).")
    add_bullet("Insulin Median:", "126.0 mu U/ml (computed on non-zero training values; applied to 374 missing rows).")
    add_bullet("BMI Median:", "32.4 kg/m^2 (computed on non-zero training values; applied to 11 missing rows).")

    add_h2("3.4 Strict Radiographic Leakage Prevention: Patient-Level & Study-Level Grouping")
    add_p("In medical computer vision, patient leakage is catastrophic. Plain radiographs frequently include multiple projections of the same anatomical limb (e.g. AP and Lateral views) or longitudinal follow-up imaging of the same fracture over time. If images are partitioned randomly at the file level, projections from the same patient land in both training and test sets. Deep neural networks rapidly memorize patient-specific trabecular bone micro-architecture, cortical contours, and orthopedic hardware rather than learning genuine fracture morphology.")
    add_p("To eliminate this, all radiographic splits across FracAtlas and GRAZPEDWRI-DX were partitioned strictly by Patient ID and Study ID using GroupKFold and stratified patient assignment. Zero patient overlap exists between training, validation, and test sets:")
    add_callout(
        "Train-Validation Patient Overlap: 0.0% (0 patients) | Train-Test Patient Overlap: 0.0% (0 patients) | Validation-Test Patient Overlap: 0.0% (0 patients). External PediURF Overlap: 0.0% with all GRAZ and FracAtlas splits.",
        prefix="Patient Isolation Audit (experiment8_leakage_audit.json): "
    )

    add_h2("3.5 Image Normalization & Standardization")
    add_p("All plain radiographs were standardized through a zero-loss preprocessing pipeline. Grayscale images were normalized to zero mean and unit variance using ImageNet channel statistics (mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225]). Global images were bicubic-interpolated to 512x512 resolution. Localized ROI crops were extracted with a 20% contextual expansion margin and bilinearly resized to 256x256 resolution.")

    add_h2("3.6 Data Augmentation Isolation (Strictly Confined to Training Folds)")
    add_p("Data augmentation operations were strictly confined to the training dataloader to prevent synthetic artifacts from contaminating validation and test evaluations. Training transforms included: (1) Random Horizontal Flip ($p = 0.50$); (2) Affine Rotation ($\pm 10$ degrees); and (3) Color Jitter (brightness $\pm 0.10$, contrast $\pm 0.10$). Validation and test pipelines applied deterministic center resizing and normalization only.")

    add_h2("3.7 Preprocessing Deliverable")
    add_p("Reproducible preprocessing pipelines in ai-prediction-service/app/models/diabetes/diabetes_preprocessing.py, ai-prediction-service/app/models/fracture/fracture_preprocessing.py, and verified leakage audit in ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8_leakage_audit.json.")

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 4 — EXPLORATORY DATA ANALYSIS (Weeks 7–8)
    # ─────────────────────────────────────────────────────────────────────────
    add_phase_header("Phase 4 — Exploratory Data Analysis", "Weeks 7–8  |  Statistical Distributions, Confounding & Skeletal Anatomy")

    add_h2("4.1 Objective")
    add_p("Perform comprehensive statistical profiling, investigate class differentials, identify physiological outliers, examine metabolic skewness, and discover anatomical confounders that distort computer vision representations.")

    add_h2("4.2 Target & Epidemiological Distribution Analysis")
    add_p("In the cleaned cardiovascular cohort ($N = 64,963$), class balance is evenly distributed: 31,910 healthy controls (49.12%) and 33,053 positive cases (50.88%). In the diabetes cohort ($N = 768$), class balance exhibits moderate epidemiological skew: 500 non-diabetic controls (65.10%) and 268 diabetic cases (34.90%). In FracAtlas ($N = 4,068$), severe class imbalance exists: 715 fractured radiographs (17.58%) vs. 3,353 non-fractured controls (82.42%). In the extracted GRAZPEDWRI-DX subset ($N = 5,031$), trauma center intake skew reverses the balance: 3,334 fractured radiographs (66.27%) vs. 1,697 normal controls (33.73%).")

    add_h2("4.3 Subgroup & Confounding Analysis (Smoking-Age Paradox & Metabolic Skewness)")
    add_p("Univariate profiling of the cardiovascular dataset revealed a classic epidemiological confounding paradox: younger patients exhibited higher reported smoking rates (45.2% in ages 30–39 vs. 18.7% in ages 60–65), creating a counter-intuitive negative crude correlation between smoking and cardiovascular events. When stratified by age decade, smoking consistently elevated risk within every stratum, confirming Simpson's paradox.")
    add_p("In the diabetes cohort, Insulin exhibited extreme right-skewness (skewness = 2.27, kurtosis = 7.18) with a biological minimum of 16.0 mu U/ml and a maximum of 744.0 mu U/ml. IQR outlier auditing identified 232 statistical outliers in insulin values, representing physiological hyperinsulinemia in severe insulin-resistant subjects.")

    add_h2("4.4 Data & Image Quality Analysis")
    add_p("Quality auditing of 5,031 GRAZPEDWRI-DX radiographs and 4,068 FracAtlas images verified zero corrupted JPEG/PNG headers, zero unreadable bitstreams, and zero truncation artifacts. Dynamic range inspection confirmed 8-bit depth across all FracAtlas images and 12-bit to 16-bit depth compressed into 8-bit standard grayscale for GRAZPEDWRI-DX.")

    add_h2("4.5 Skeletal Morphology & Pediatric Growth Plate Anatomical Confounders")
    add_p("The central discovery of MediMind's computer vision EDA was the morphological confounding created by pediatric epiphyseal growth plates (physes). In skeletally immature patients (children and adolescents), the distal radius and ulna feature cartilaginous growth plates that appear on radiographs as transverse radiolucent bands—dark linear gaps across bone tissue. To a whole-image convolutional neural network (e.g. ResNet-18 or DenseNet-121), these normal anatomical radiolucencies are visually identical to acute, non-displaced cortical fracture lines.")
    add_p("When adult-trained CNNs were evaluated on pediatric radiographs, they triggered false alarms on 100% of normal growth plates, collapsing specificity on normal pediatric controls to 0.00% (251 false positives across 251 normal images in Experiment 2C).")

    add_h2("4.6 Important EDA Questions")
    add_bullet("EDA Question 1:", "Can classical tabular models exploit non-linear combinations like pulse pressure (AP_HIGH - AP_LOW) without explicit feature engineering? No; decision trees require inefficient multi-level splits to approximate diagonal boundaries.")
    add_bullet("EDA Question 2:", "Are pediatric growth plates localized to specific anatomical zones? Yes; epiphyseal physes are strictly confined to the metaphysis-epiphysis junction, whereas fractures occur across distal, midshaft, and proximal bone shafts.")
    add_bullet("EDA Question 3:", "What are the anatomical proportions of pediatric wrist fractures? In the Shenzhen PediURF cohort ($N = 1,053$), fractures are distributed as: Distal radius/ulna = 677 (64.29%), Midshaft radius/ulna = 265 (25.17%), and Proximal radius/ulna = 111 (10.54%).")

    add_h2("4.7 Deliverable")
    add_p("Comprehensive EDA distributions and bivariate relationship matrices in ai-prediction-service/artifacts/heart_disease/training_report.json, ai-prediction-service/artifacts/diabetes/training_report.json, and spatial error breakdown in ai-prediction-service/artifacts/fracture_v2/experiment5_localization/error_analysis.json.")

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 5 — FEATURE ENGINEERING & REPRESENTATION (Weeks 8–9)
    # ─────────────────────────────────────────────────────────────────────────
    add_phase_header("Phase 5 — Feature Engineering & Representation", "Weeks 8–9  |  Inductive Priors, ROI Spaces & Spatial Bounding Boxes")

    add_h2("5.1 Objective")
    add_p("Transform raw input variables into pathophysiologically expressive features for tabular models, and evolve deep computer vision representations from unconstrained whole images to localized Region-of-Interest (ROI) spaces that isolate genuine fractures from growth plate mimics.")

    add_h2("5.2 Basic Features & Hemodynamic Biomechanics (Pulse Pressure & BMI)")
    add_p("In clinical hemodynamics, raw systolic and diastolic arterial pressures do not fully capture cardiovascular biomechanical stress. Two non-linear transformations were engineered:")
    add_bullet("Pulse Pressure (PP):", "PP = AP_HIGH - AP_LOW (mmHg). Directly measures arterial stiffness and pulsatile load on the coronary vasculature.")
    add_bullet("Body Mass Index (BMI):", "BMI = Weight (kg) / (Height (m))^2. Non-linear adiposity index categorizing patients into underweight (< 18.5), normal (18.5–24.9), overweight (25.0–29.9), and obese (>= 30.0).")
    add_p("Statistical clarification on tree-based invariance: Decision trees are invariant to monotonic transformations of individual features (e.g. log(x)), but they are fundamentally NOT invariant to multi-feature combinations (such as $x_1 - x_2$ or $x_1 / x_2^2$). Tree algorithms partition feature space using orthogonal, axis-aligned hyperplanes ($x_i \le c$). Representing a diagonal boundary like $x_1 - x_2 \le 40$ requires a deep, data-hungry 'staircase' approximation. Explicitly engineering Pulse Pressure and BMI provides tree ensembles with direct access to non-axis-aligned hemodynamic surfaces.")
    add_callout(
        "Production Schema Reconciliation: While Pulse Pressure and BMI were evaluated during exploratory feature engineering, the production checkpoint (best_model.joblib) operates strictly on the 11 verified raw numeric features (AGE, GENDER, HEIGHT, WEIGHT, AP_HIGH, AP_LOW, CHOLESTEROL, GLUCOSE, SMOKE, ALCOHOL, PHYSICAL_ACTIVITY) to guarantee zero deployment drift.",
        prefix="Feature Schema Note: "
    )

    add_h2("5.3 Deep Radiographic Representation Evolution: A 4-Stage Trajectory")
    add_p("MediMind's deep learning fracture detection architecture evolved through four distinct representational paradigms:")
    add_bullet("Stage 1 — Global Whole-Image Classification (Exp 1, 2A, 2B, 2C):", "Passed full 512x512 radiographs directly into ImageNet and MURA-pretrained ResNet-18 backbones. Failed catastrophically on pediatric images (0.00% specificity on normal controls) due to growth plate confounding.")
    add_bullet("Stage 2 — Targeted Pediatric Tuning & Dual Specialized Models (Exp 3, 4):", "Froze early convolutional layers and tuned specialized heads for adult vs. pediatric images. Specificity improved marginally from 0.00% to 1.59%, proving that whole-image classification cannot decouple open physes from fractures.")
    add_bullet("Stage 3 — Single-View Object Detection (Exp 5):", "Trained a YOLOv8n object detector to predict spatial bounding boxes [x_center, y_center, w, h] around candidate fractures. Achieved mAP50 = 0.7744, precision = 0.8437, recall = 0.6667, and successfully elevated normal pediatric control specificity to 87.25%.")
    add_bullet("Stage 4 — Dual-View Localized ROI Fusion (Exp 8A):", "Extracted 20% expanded ROI crops (256x256) centered on YOLOv8 candidate coordinates across paired AP and Lateral views. Fed paired ROIs into a dual-stream ResNet-18 feature extractor with late concatenation fusion and a calibrated sigmoid head, achieving 95.18% sensitivity, 75.25% test specificity, and 87.25% normal control specificity.")

    add_h2("5.4 Spatial Localized ROI Representation (Why Bounding Boxes Solved the Growth Plate Problem)")
    add_p("Systematic false-positive auditing confirmed why spatial bounding boxes resolved the growth plate confounding. In whole-image CNNs, global average pooling aggregates activations across the entire lung or bone field; the network cannot distinguish whether high activation originated from a genuine distal radius fracture or an adjacent epiphyseal growth plate. By training YOLOv8 to localize bounding boxes specifically on disrupted cortical edges, the model restricts feature extraction to focal lesion coordinates, ignoring non-lesioned growth plates.")
    add_p("If the YOLO detector detects no fracture bounding box on either view (confidence < 0.17), the architecture safely defaults to zero fracture probability. This clean fallback eliminated false alarms on 219 out of 251 normal pediatric radiographs (87.25% specificity).")

    add_h2("5.5 Feature Engineering Report")
    add_p("Engineering specifications and ROI cropping logic in ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8_roi_strategy_audit.json and ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8_multiview_roi_alignment.json.")

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 6 — MODEL BUILDING & COMPARISON (Weeks 10–11)
    # ─────────────────────────────────────────────────────────────────────────
    add_phase_header("Phase 6 — Model Building & Comparison", "Weeks 10–11  |  Candidate Algorithms, Thresholds & Multi-View Fusion")

    add_h2("6.1 Objective")
    add_p("Train and benchmark candidate classical machine learning and deep learning algorithms, optimize decision thresholds under asymmetric clinical utility, configure two-stage transfer learning schedules, and construct a comprehensive master comparison table.")

    add_h2("6.2 Classical Tabular Baseline Benchmarking (Logistic Regression, Random Forest, MLP)")
    add_p("For tabular cardiovascular and diabetes risk prediction, three candidate algorithms were trained and evaluated on stratified partitions:")
    add_bullet("Logistic Regression:", "Linear baseline utilizing StandardScaler preprocessing, L2 regularization (C = 1.0), and L-BFGS solver.")
    add_bullet("Random Forest Classifier:", "Non-linear ensemble of 200 de-correlated decision trees (max_depth = 12 for cardio, max_depth = 10 for diabetes; class_weight = 'balanced').")
    add_bullet("Multi-Layer Perceptron (MLP):", "Feed-forward neural network implemented in scikit-learn (MLPClassifier). Architecture: input -> StandardScaler -> Hidden Layer 1 (32 units, ReLU) -> Hidden Layer 2 (16 units, ReLU) -> Output (1 unit, Logistic Sigmoid). Trained using Adam optimizer, L2 penalty alpha = 0.001, early stopping with 15% validation fraction, stopping at 48 iterations.")
    add_p("Table 6.1 compares all tabular candidate models at the uniform default operating point ($\tau = 0.50$).")

    headers_t7 = ["Target Domain", "Candidate Algorithm", "Threshold (tau)", "Validation Rec", "Validation Spec", "Test Recall", "Test Spec", "Test ROC-AUC", "Test Brier"]
    rows_t7 = [
        ["Cardiovascular Risk", "Logistic Regression", "0.5000", "68.25%", "76.12%", "68.80%", "76.04%", "0.7866", "0.1874"],
        ["Cardiovascular Risk", "Random Forest", "0.5000", "69.20%", "76.68%", "69.50%", "76.39%", "0.7961", "0.1829"],
        ["Cardiovascular Risk", "MLP Classifier (32, 16)", "0.5000", "70.29%", "74.66%", "70.84%", "74.72%", "0.7956", "0.1835"],
        ["Diabetes Risk", "Logistic Regression", "0.5000", "55.00%", "80.00%", "51.22%", "92.00%", "0.8624", "0.1421"],
        ["Diabetes Risk", "Random Forest", "0.5000", "60.00%", "82.67%", "48.78%", "89.33%", "0.8332", "0.1580"],
        ["Diabetes Risk", "MLP Classifier (32, 16)", "0.5000", "45.00%", "89.33%", "39.02%", "92.00%", "0.8267", "0.1647"]
    ]
    add_styled_table(headers_t7, rows_t7, [Inches(1.2), Inches(1.5), Inches(0.8), Inches(0.8), Inches(0.8), Inches(0.8), Inches(0.8), Inches(0.8), Inches(0.7)])

    add_h2("6.3 Decision Threshold Optimization Methodology")
    add_p("At default threshold $\tau = 0.50$, all models fail clinical screening requirements: Cardiovascular RF captures only 69.50% of events, and Diabetes MLP captures only 39.02% of diabetics. To rectify this, decision thresholds were tuned exclusively on validation folds using the following selection rule: Maximize Sensitivity / Recall subject to Specificity >= 0.60 across candidate thresholds [0.05, 0.95] in steps of 0.05.")
    add_bullet("Cardiovascular RF Selected Threshold:", "tau = 0.4000. On validation, recall reached 79.39% with 63.96% specificity. On held-out test, recall achieved 80.01% with 63.40% specificity (95% CI: [78.88%, 81.10%]).")
    add_bullet("Diabetes MLP Selected Threshold:", "tau = 0.2500. On validation, recall reached 87.50% with 64.00% specificity. On held-out test, recall achieved 80.49% with 68.00% specificity (95% CI: [65.99%, 89.77%]).")
    add_bullet("Fracture ResNet-18 Baseline:", "tau = 0.1800. On validation, recall reached 88.99% with 61.43% specificity. On held-out test, recall achieved 96.26% with 63.64% specificity (95% CI: [90.78%, 98.54%]).")
    add_bullet("Fracture DualViewROIResNet18 (Exp 8A):", "tau = 0.0100. On validation, sensitivity reached 91.74% with 77.36% specificity. On held-out test, sensitivity reached 95.18% with 75.25% specificity (95% CI: [91.77%, 97.22%]).")

    add_h2("6.4 Deep Learning Fracture Progression Across Experiments 1 to 8A")
    add_p("Table 6.2 presents the master experimental progression across all fracture detection models, documenting the exact cohort, architecture, threshold, sensitivity, specificity, and normal-control specificity.")

    headers_t8 = ["Exp ID", "Model Architecture & Strategy", "Evaluation Cohort & Split", "Threshold (tau)", "Sensitivity (%)", "Specificity (%)", "Normal Ped Spec (%)", "Key Finding"]
    rows_t8 = [
        ["Exp 1", "MURA Pretrained ResNet-18", "FracAtlas Held-Out Test (N=613)", "0.1800", "96.26%", "63.64%", "N/A (Adult)", "Production adult baseline; high sensitivity, low precision (35.89%)"],
        ["Exp 2A", "FracAtlas Only ResNet-18", "FracAtlas Held-Out Test (N=613)", "0.2600", "86.55%", "73.74%", "N/A (Adult)", "Eliminating MURA pretraining lowered sensitivity from 96.26% to 86.55%"],
        ["Exp 2B", "GRAZPEDWRI-DX Only ResNet-18", "GRAZ Test Split (N=769)", "0.5100", "99.42%", "0.80%", "0.80%", "Trained only on pediatric images; collapsed on normal controls"],
        ["Exp 2C", "Combined FracAtlas + GRAZ ResNet-18", "Combined Test Split (N=1,383)", "0.3700", "97.41%", "40.78%", "0.00%", "Severe growth plate confounding; 251 / 251 normal controls false alarm"],
        ["Exp 3", "Pediatric-Bias Fine-Tuning ResNet-18", "GRAZ Test Split (N=769)", "0.1000", "99.42%", "0.80%", "0.80%", "Freezing early layers failed to eliminate growth plate false alarms"],
        ["Exp 4", "Age-Aware Dual Specialized ResNet-18", "GRAZ Test Split (N=769)", "0.0800", "89.92%", "1.59%", "1.59%", "Dual-branch model marginally improved specificity to 1.59%; still unusable"],
        ["Exp 5", "YOLOv8n Single-View Bounding Box", "GRAZ Test Split (N=769)", "0.1700", "91.70%", "87.25%", "87.25%", "Breakthrough: Localized bounding boxes solved growth plate false alarms"],
        ["Exp 6", "Heuristic Max YOLOv8n (max(AP, LAT))", "GRAZ Test Paired (N=350)", "0.1700", "94.59%", "87.25%", "87.25%", "Multi-view heuristic fusion rescued subtle single-view fracture misses"],
        ["Exp 7A", "Global Whole-Image Dual-View ResNet-18", "GRAZ Test Paired (N=350)", "0.0100", "100.0%", "0.00%", "0.00%", "Catastrophic collapse: Whole-image dual view classified all physes as fractures"],
        ["Exp 8A", "DualViewROIResNet18 (Localized Fusion)", "GRAZ Test Paired (N=350)", "0.0100", "95.18%", "75.25%", "87.25%", "Formally frozen research best: 24 lateral rescues; 87.25% normal specificity"]
    ]
    add_styled_table(headers_t8, rows_t8, [Inches(0.6), Inches(1.8), Inches(1.4), Inches(0.7), Inches(0.8), Inches(0.8), Inches(0.9), Inches(2.0)])

    # Embedded Figure 2: Progression Bar Chart
    add_image_figure('figures/fig2_pediatric_fracture_progression.png', "Figure 6.1: Musculoskeletal Fracture Detection Progression across Experiments 1 to 8A, illustrating the resolution of the pediatric growth plate false-positive collapse through localized ROI representation.")

    add_h2("6.5 Deep Architecture: Dual-View ROI-Aligned Fusion (`DualViewROIResNet18`)")
    add_p("Experiment 8A represents MediMind's state-of-the-art deep learning architecture (11,439,681 total parameters). It resolves the trade-off between sensitivity and specificity by decoupling object localization from feature fusion:")
    add_bullet("1. Dual-View YOLOv8n Localization:", "Paired AP and Lateral radiographs are independently processed by YOLOv8n at detector threshold 0.17 to generate candidate fracture bounding boxes [x, y, w, h]. If no box is detected on either view, default zero probability is emitted.")
    add_bullet("2. Context-Expanded ROI Cropping:", "Detected bounding boxes are expanded by a 20% margin to incorporate adjacent trabecular architecture and periosteal contours, then bilinearly resized to 256x256.")
    add_bullet("3. Dual-Stream ResNet-18 Encoders:", "Stream A processes the AP ROI; Stream B processes the Lateral ROI. Each stream utilizes an ImageNet-pretrained ResNet-18 backbone up to the average pooling layer, producing a 512-dimensional feature vector per view.")
    add_bullet("4. Late Concatenation & Classification Head:", "The 512-dim AP and 512-dim Lateral vectors are concatenated into a 1,024-dimensional joint representation, followed by BatchNorm, Dropout (p = 0.30), Linear(1024 -> 128), ReLU, Linear(128 -> 1), and a calibrated Sigmoid activation function.")

    add_h2("6.6 Training Pipeline, Loss Functions & Two-Stage Transfer Learning")
    add_p("Experiment 8A was trained across 15 epochs utilizing a disciplined two-stage transfer learning schedule:")
    add_bullet("Stage 1 (Epochs 1–3):", "Backbones frozen; training restricted to the late-fusion classification head using Adam optimizer (learning rate = 1e-3, batch size = 16, BCEWithLogitsLoss with pos_weight = 1.0). Best validation ROC-AUC (0.9405) achieved at Epoch 1.")
    add_bullet("Stage 2 (Epochs 4–15):", "Full network unfrozen; end-to-end fine-tuning with differential learning rates (backbone lr = 1e-5, head lr = 1e-4) with cosine annealing decay. Total training duration: 5,268.7 seconds on CPU.")
    
    # Embedded Figure 1: Training Curves
    add_image_figure('figures/fig1_exp8a_training_curves.png', "Figure 6.2: Experiment 8A training loss and validation discrimination (ROC-AUC and PR-AUC) curves across 15 epochs, showing optimal checkpoint selection at Epoch 1.")

    add_h2("6.7 Model Comparison (Master Performance Table)")
    add_p("Table 6.3 provides the master comparison of all final deployed models across their primary held-out test cohorts at their chosen clinical operating thresholds.")

    headers_t9 = ["Model Domain", "Deployed Architecture", "Checkpoint File", "Operating Threshold", "Recall / Sens (95% CI)", "Specificity (95% CI)", "PPV (%)", "NPV (%)", "ROC-AUC", "PR-AUC", "Brier Score", "ECE"]
    rows_t9 = [
        ["Cardiovascular", "Random Forest (200 trees)", "best_model.joblib", "0.4000", "80.01% [78.88, 81.10]", "63.40% [62.03, 64.75]", "69.37%", "75.38%", "0.7961", "0.7835", "0.1829", "0.0080"],
        ["Diabetes Risk", "MLP Classifier (32, 16)", "best_model.joblib", "0.2500", "80.49% [65.99, 89.77]*", "68.00% [56.79, 77.46]", "57.89%", "86.44%", "0.8267", "0.7205", "0.1647", "0.1037"],
        ["Fracture (Prod)", "MURA ResNet-18 (Single)", "best_model.pt", "0.1800", "96.26% [90.78, 98.54]", "63.64% [59.36, 67.71]", "35.89%", "98.77%", "0.9244", "0.7843", "0.0896", "0.1021"],
        ["Fracture (Exp 8A)", "DualViewROIResNet18", "experiment8a_best.pt", "0.0100", "95.18% [91.77, 97.22]", "75.25% [66.01, 82.64]", "90.46%", "86.36%", "0.9586", "0.9860", "0.0811", "0.0897"]
    ]
    add_styled_table(headers_t9, rows_t9, [Inches(1.0), Inches(1.3), Inches(1.0), Inches(0.7), Inches(1.1), Inches(1.1), Inches(0.6), Inches(0.6), Inches(0.6), Inches(0.6), Inches(0.6), Inches(0.5)])
    add_p("*Note: Diabetes test cohort is flagged as a small sample (N = 116 total, n = 41 positive events), yielding a wide Wilson 95% confidence interval width of 23.78 percentage points.")

    add_h2("6.8 Technology Stack & Hardware Environment")
    add_p("Models were implemented in Python 3.14 using PyTorch 2.14.1+cpu and scikit-learn 1.9.1. Training was executed on an Intel x86_64 CPU workstation (zero GPU dependencies required for production inference, ensuring cost-effective clinical deployment).")

    # ─────────────────────────────────────────────────────────────────────────
    # PHASE 7 — EVALUATION & CLINICAL INTERPRETATION (Week 12)
    # ─────────────────────────────────────────────────────────────────────────
    add_phase_header("Phase 7 — Evaluation & Clinical Interpretation", "Week 12  |  Calibration, External Generalization & Multi-View Synergy")

    add_h2("7.1 Objective")
    add_p("Quantify model generalization across independent test partitions, analyze multi-view orthogonal rescues, stress-test specificity on pediatric normal controls, evaluate cross-institutional transfer on Shenzhen PediURF, and evaluate probability calibration.")

    add_h2("7.2 Multi-Dimensional Evaluation Tensor with 95% Wilson Confidence Intervals")
    add_p("To avoid reliance on point estimates, Wilson 95% score confidence intervals were computed directly from test confusion matrices across all cohorts:")
    add_bullet("Cardiovascular Test Split (N = 9,745):", "Sensitivity = 80.01% (95% CI: [78.88%, 81.10%]); Specificity = 63.40% (95% CI: [62.03%, 64.75%]); TP = 3,967, FP = 1,752, TN = 3,035, FN = 991.")
    add_bullet("Diabetes Test Split (N = 116 — Small Cohort):", "Sensitivity = 80.49% (95% CI: [65.99%, 89.77%]); Specificity = 68.00% (95% CI: [56.79%, 77.46%]); TP = 33, FP = 24, TN = 51, FN = 8.")
    add_bullet("Fracture FracAtlas Baseline Test (N = 613):", "Sensitivity = 96.26% (95% CI: [90.78%, 98.54%]); Specificity = 63.64% (95% CI: [59.36%, 67.71%]); TP = 103, FP = 184, TN = 322, FN = 4.")
    add_bullet("Fracture Exp 8A GRAZ Paired Test (N = 350 studies):", "Sensitivity = 95.18% (95% CI: [91.77%, 97.22%]); Specificity = 75.25% (95% CI: [66.01%, 82.64%]); TP = 237, FP = 25, TN = 76, FN = 12.")
    add_bullet("Fracture Exp 8A Normal Stress Test (N = 251 normal images):", "Specificity = 87.25% (95% CI: [82.56%, 90.82%]); TN = 219, FP = 32.")
    add_bullet("Fracture Exp 8A Shenzhen PediURF (N = 1,053 studies):", "Sensitivity = 94.59% (95% CI: [93.05%, 95.80%]); TP = 996, FN = 57.")

    add_h2("7.3 Multi-View Diagnostic Synergy & Orthogonal Lateral Rescues (GRAZ Test N = 350)")
    add_p("In clinical radiography, bi-planar projections (AP and Lateral) are acquired because non-displaced fractures frequently lie parallel to the X-ray beam on one view, rendering them invisible. Table 7.1 details the multi-view breakdown across the 350 held-out test studies.")

    headers_t10 = ["Multi-View Detection State", "Total Studies", "Fracture Positive", "Fractures Detected", "Sensitivity (%)", "Clinical Diagnostic Interpretation"]
    rows_t10 = [
        ["State A: Dual Detection", "209 studies", "207 positive", "207 detected", "100.0%", "Fracture clearly visible and localized on both AP and Lateral projections."],
        ["State B: AP-Only Detection", "14 studies", "6 positive", "6 detected", "100.0%", "Fracture localized exclusively on AP view; lateral view radiographically subtle."],
        ["State C: Lateral Rescue", "39 studies", "24 positive", "24 detected", "100.0%", "Orthogonal Lateral Rescue: Fracture completely occult on AP view, rescued by Lateral ROI."],
        ["State D: Zero Detection", "88 studies", "12 positive", "0 detected", "0.0%", "False Negatives: Detector conf < 0.17 on both views (subtle non-displaced greenstick/buckle fractures)."]
    ]
    add_styled_table(headers_t10, rows_t10, [Inches(1.5), Inches(0.9), Inches(1.1), Inches(1.1), Inches(0.9), Inches(2.5)])
    add_p("State C confirms the clinical thesis of multi-view imaging: exactly 24 acute fractures were radiographically occult on the Anteroposterior projection and would have been discharged as false negatives without the orthogonal Lateral view.")

    add_h2("7.4 Pediatric Specificity Stress Testing on Normal Controls (N = 251)")
    add_p("To definitively test whether Experiment 8A resolved the growth plate false-alarm failure, the architecture was evaluated against the isolated cohort of 251 uncorrupted normal pediatric wrist radiographs (children with fully active, open epiphyseal physes). Experiment 8A achieved 87.25% specificity (219 true negatives, 32 false positives). The remaining 32 false alarms occurred on prominent distal radial growth plates where focal detector confidence slightly exceeded 0.17 (mean FP confidence = 0.2836).")

    add_h2("7.5 Multi-Center External Validation on Shenzhen PediURF Cohort (N = 1,053 Studies)")
    add_p("To confirm cross-institutional transfer, Experiment 8A was deployed without fine-tuning against the independent Shenzhen PediURF cohort (1,053 paired studies / 2,106 radiographs from Shenzhen Children's Hospital). The model achieved 94.59% sensitivity (996 of 1,053 fractures detected; 95% CI: [93.05%, 95.80%]).")
    
    # Embedded Figure 3: PediURF Subgroup
    add_image_figure('figures/fig3_pediurf_subgroup_sensitivity.png', "Figure 7.1: External validation sensitivity across Shenzhen PediURF anatomical zones (Distal 93.35%, Midshaft 97.74%, Proximal 94.59%).")
    add_callout(
        "Denominators & Metric Scope: The Shenzhen PediURF test cohort consists entirely of confirmed fracture-positive trauma studies (100% positive prevalence). Consequently, PediURF evaluates Sensitivity / Recall only. Specificity, False Positive Rate, and ROC-AUC cannot be computed on this cohort due to the absence of negative controls.",
        prefix="Clinical Cohort Scope: "
    )

    add_h2("7.6 Probability Calibration Deep-Dive: Brier Score & Expected Calibration Error (ECE)")
    add_p("In clinical decision support, posterior probabilities must reflect true empirical event frequencies. If an algorithm assigns a 0.70 risk score to 100 patients, exactly 70 of those patients should develop the condition. Figure 7.2 presents the reliability diagrams across 10 probability bins.")
    
    # Embedded Figure 4: Calibration
    add_image_figure('figures/fig4_calibration_reliability_diagrams.png', "Figure 7.2: Probability calibration reliability diagrams and Expected Calibration Error (ECE) for Cardiovascular Random Forest (ECE = 0.0080) and Diabetes MLP (ECE = 0.1037).")
    add_p("Cardiovascular Random Forest demonstrated exceptional calibration (Brier Score = 0.1829, ECE = 0.0080). Diabetes MLP achieved Brier Score = 0.1647 and ECE = 0.1037. Fracture Baseline achieved Brier = 0.0896 and ECE = 0.1021. Experiment 8A achieved Brier = 0.0811 and ECE = 0.0897.")

    # Embedded Figure 5: ROC / PR Curves
    add_image_figure('figures/fig5_exp8a_test_roc_pr_curves.png', "Figure 7.3: Experiment 8A test ROC (AUC = 0.9586) and Precision-Recall (AUC = 0.9860) curves on held-out GRAZPEDWRI-DX paired test cohort.")

    add_h2("7.7 Error Auditing, Visual Explainability (Grad-CAM) & Failure Modes")
    add_p("Error auditing of the 12 false negatives in Experiment 8A revealed that all 12 cases were subtle, non-displaced torus (buckle) fractures of the distal radius where periosteal disruption was under 1.5 mm, resulting in YOLOv8 detector confidence falling below 0.17 on both projections. Grad-CAM visual explainability maps confirmed that for true positive cases, gradient activations concentrated precisely over the cortical bone disruption margin.")

    add_h2("7.8 Deliverables")
    add_p("Evaluation manifests and error breakdowns: ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_graz_test_results.json, ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_normal_control_results.json, and ai-prediction-service/artifacts/fracture_v2/experiment8_multiview_localized/experiment8a_pediurf_results.json.")

    # ─────────────────────────────────────────────────────────────────────────
    # END-TO-END DATA SCIENCE AND DEEP LEARNING PIPELINE
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("End-to-End Data Science and Deep Learning Pipeline")
    add_p("The production machine learning and deep learning training and evaluation pipeline replaces ad-hoc scripts with a reproducible, manifest-driven workflow:")
    add_bullet("1. Ingestion & Deduplication:", "Ingests multi-modal sources, computes cryptographic row hashes, excises exact duplicates (-3,820 rows), and verifies 100% patient isolation.")
    add_bullet("2. Leakage-Free Preprocessing:", "Computes biological zero medians exclusively on the training partition; normalizes features and images via training fold statistics.")
    add_bullet("3. Model Training & Two-Stage Transfer Learning:", "Fits classical ensembles (Random Forest, Logistic Regression, MLP) and trains deep dual-stream convolutional backbones across frozen and unfrozen stages.")
    add_bullet("4. Validation Threshold Optimization:", "Tunes operating thresholds on validation data to satisfy clinical sensitivity floors (>= 80% tabular, >= 90% trauma).")
    add_bullet("5. Calibration & Error Auditing:", "Generates 10-bin reliability diagrams, computes ECE and Brier scores, extracts Grad-CAM heatmaps, and saves frozen artifacts with SHA-256 hashes.")

    add_h2("Database Schema & Manifest Architecture")
    add_p("Table 8.1 outlines the database tables supporting model manifests, patient encounters, and prediction logging.")
    
    headers_t11 = ["Table Name", "Primary Key", "Important Schema Fields & Lineage Pointers"]
    rows_t11 = [
        ["ml_model_registry", "model_id", "model_name, version, architecture, checkpoint_path, sha256_hash, operating_threshold, ece_score, is_active"],
        ["patient_manifest", "patient_id", "demographic_age, gender, study_ids, split_assignment (train/val/test), cryptographic_row_hash"],
        ["radiology_studies", "study_id", "patient_id, dataset_source, ap_image_path, lat_image_path, fracture_ground_truth, anatomical_category"],
        ["model_inferences", "inference_id", "patient_id, model_id, raw_probability, calibrated_probability, binary_prediction, inference_latency_ms, execution_timestamp"]
    ]
    add_styled_table(headers_t11, rows_t11, [Inches(1.8), Inches(1.2), Inches(4.0)])

    # ─────────────────────────────────────────────────────────────────────────
    # APPLICATION AND MODEL SERVING
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("Application and Model Serving")
    add_p("MediMind serves trained models through a high-performance FastAPI service (ai-prediction-service). The service loads model checkpoints at startup, exposes OpenAPI/REST endpoints, enforces Pydantic input validation, applies preprocessing transformations, and evaluates predictions against locked operating thresholds.")
    
    add_h2("FastAPI Serving Architecture")
    add_p("The service loads model checkpoints directly from artifacts/heart_disease/best_model.joblib, artifacts/diabetes/best_model.joblib, and artifacts/fracture/best_model.pt. Inferences run locally on CPU, ensuring zero external cloud API dependencies.")

    add_h2("Example Inference Request (JSON)")
    add_p("POST /api/v1/heart-disease/predict HTTP/1.1\nContent-Type: application/json\n\n{\n  \"age\": 54.0,\n  \"gender\": 1,\n  \"height\": 165.0,\n  \"weight\": 74.0,\n  \"ap_high\": 140.0,\n  \"ap_low\": 90.0,\n  \"cholesterol\": 2,\n  \"glucose\": 1,\n  \"smoke\": 0,\n  \"alcohol\": 0,\n  \"physical_activity\": 1\n}")

    add_h2("Example Inference Response (JSON)")
    add_p("HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\n  \"model_name\": \"heart_disease_risk\",\n  \"model_version\": \"0.2.0\",\n  \"raw_probability\": 0.5421,\n  \"calibrated_probability\": 0.5421,\n  \"operating_threshold\": 0.4000,\n  \"risk_category\": \"HIGH_RISK\",\n  \"recommendation\": \"Elevated pulsatile pressure (50 mmHg) and Stage 1 systolic hypertension. Confirmatory clinical cardiovascular assessment recommended.\",\n  \"disclaimer\": \"Clinical decision-support aid. Not an autonomous diagnosis.\"\n}")

    add_h2("User Interface & Clinical Decision-Support Presentation")
    add_p("The clinical frontend renders calibrated posterior risk probabilities, risk category badges (Low, Moderate, High), key physiological factor attributions, and localized radiographic bounding boxes with bi-planar AP and Lateral views side-by-side.")

    # ─────────────────────────────────────────────────────────────────────────
    # ETHICAL, PRIVACY AND RESPONSIBLE AI CONSIDERATIONS
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("Ethical, Privacy and Responsible AI Considerations")
    add_bullet("Demographic Constraints & Transfer Bias:", "The Pima Indians Diabetes database represents exclusively female Pima Indian individuals aged >= 21 years. Transferring this model to male patients or non-Indigenous demographic groups carries severe distributional risks and requires external calibration.")
    add_bullet("Pediatric Bone Anatomy Protection:", "Failing to account for epiphyseal growth plates in pediatric patients leads to catastrophic false-positive overtreatment. Models must enforce spatial bounding-box gating or pediatric-specific calibration.")
    add_bullet("Cryptographic Auditability:", "All deployed checkpoints are cryptographically hashed using SHA-256 to guarantee exact provenance and prevent silent parameter drift.")
    add_bullet("Non-Diagnostic Decision Support Boundary:", "MediMind is strictly designated as a clinical decision-support tool. Algorithmic outputs are non-diagnostic and must never replace the clinical judgment of licensed medical practitioners.")

    # ─────────────────────────────────────────────────────────────────────────
    # EXPECTED FINAL DEMONSTRATION
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("Expected Final Demonstration")
    add_p("The final academic demonstration verifies end-to-end model execution across all four clinical domains:")
    add_bullet("Hemodynamic Risk Screening:", "Submitting patient vitals triggers immediate Random Forest evaluation, outputting calibrated probability (0.5421), factor attribution, and threshold gating at tau = 0.4000.")
    add_bullet("Metabolic Risk Screening:", "Submitting metabolic labs triggers MLP evaluation at tau = 0.2500, displaying lifestyle warning flags.")
    add_bullet("Bi-Planar Fracture Detection:", "Uploading paired AP and Lateral wrist radiographs triggers YOLOv8 localization, extracts 256x256 ROI crops, executes DualViewROIResNet18 late fusion at tau = 0.0100, and displays side-by-side bounding boxes with lateral rescue confirmation.")
    add_bullet("Clinical Latency Scope:", "[DATA NEEDED: per-model inference latency benchmark logs on standardized hardware; searched in scripts/benchmark_results.json and ai-prediction-service/artifacts/]. Backend network endpoint benchmarks demonstrated warm paginated response latencies of 28.2 ms (p95 = 41.36 ms).")

    # ─────────────────────────────────────────────────────────────────────────
    # PROJECT ASSESSMENT SUMMARY
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("Project Assessment Summary")
    add_p("Table 9.1 provides the formal project evaluation matrix matching the academic assessment criteria across all 7 phases.")

    headers_t12 = ["Project Phase", "Lifecycle Weeks", "Primary Assessment Focus & Key Deliverable"]
    rows_t12 = [
        ["Phase 1: Problem Identification", "Weeks 1–2", "Clinical framing, stakeholder matrix, asymmetric loss formulation (C_FN >> C_FP), and KPI hierarchy."],
        ["Phase 2: Data Collection & Integration", "Weeks 3–4", "Multi-modal dataset inventory (Cardio 68k, Pima 768, FracAtlas, MURA, GRAZ, PediURF), licensing audits, and cohort isolation."],
        ["Phase 3: Data Preparation", "Weeks 5–6", "Cryptographic duplicate excision (-3,820 rows), train-only median biological zero imputation, and 100% patient-level isolation."],
        ["Phase 4: Exploratory Data Analysis", "Weeks 7–8", "Statistical profiling, smoking-age confounding paradox, metabolic skewness, and discovery of growth plates as false-positive mimics."],
        ["Phase 5: Feature Engineering", "Weeks 8–9", "Hemodynamic transformations (Pulse Pressure, BMI), 4-stage vision progression, and localized ROI bounding-box cropping."],
        ["Phase 6: Model Building & Comparison", "Weeks 10–11", "Tabular benchmarking (LR, RF, MLP), threshold optimization (tau), DualViewROIResNet18 architecture, and master results table."],
        ["Phase 7: Evaluation & Interpretation", "Week 12", "95% Wilson CIs, 24 lateral rescues, normal control stress testing (87.25% spec), PediURF external validation (94.59% sens), and ECE calibration."]
    ]
    add_styled_table(headers_t12, rows_t12, [Inches(1.8), Inches(1.1), Inches(4.1)])

    # ─────────────────────────────────────────────────────────────────────────
    # FINAL STUDENT PROJECT STATEMENT
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("Final Student Project Statement")
    add_p("The MediMind project demonstrates that rigorous data hygiene, domain-specific inductive priors, and probabilistic calibration are paramount in healthcare AI. Through systematic investigation, we established that scaling model depth is futile when architectures latch onto anatomical confounders; instead, representation engineering—decoupling localized detection from late-fusion classification—solved the pediatric growth plate failure while preserving sensitivity. By enforcing train-only parameter fitting, patient-level data partitioning, asymmetric threshold optimization, and multi-center external validation, MediMind bridges the gap between academic benchmarks and translational clinical decision support.")

    # ─────────────────────────────────────────────────────────────────────────
    # FOURTEEN FOUNDATIONAL DATA SCIENCE INSIGHTS
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("Fourteen Foundational Data Science Insights from MediMind")
    add_bullet("1. Data Quality Trumps Algorithmic Complexity:", "Improving raw data cleanliness—purging duplicate patient records and imputing biological zeros—produces larger clinical reliability gains than tuning complex hyperparameters.")
    add_bullet("2. Hidden Duplicates Contaminate Evaluation Splits:", "In clinical cohorts, failing to remove duplicate records allows identical patient feature patterns to leak across partitions, producing overly optimistic test metrics that conceal clinical failure modes.")
    add_bullet("3. Patient-Level Splitting Is Mandatory in Medical Vision:", "Random image-level partitioning allows convolutional networks to memorize patient-specific bone textures across views. Medical images must always be partitioned by Patient ID.")
    add_bullet("4. Class Imbalance Invalidates Accuracy:", "In low-prevalence screening cohorts, overall accuracy is mathematically misleading. Evaluation must rely on recall, specificity, precision, NPV, and PR-AUC.")
    add_bullet("5. Asymmetric Clinical Utility Dictates Decision Thresholds:", "Default 0.50 thresholds assume equal error costs. In diagnostic screening, false negatives are far more dangerous than false positives, requiring threshold tuning on validation folds.")
    add_bullet("6. ROC-AUC Can Mask High False Alarm Burdens:", "Under severe class imbalance, ROC-AUC can remain deceptively high (> 0.90) even when an algorithm produces hundreds of false alarms. Precision-Recall AUC provides a truer measure of positive predictive value.")
    add_bullet("7. PR-AUC Is the Decisive Metric Under Imbalance:", "PR-AUC directly captures the trade-off between sensitivity and precision, making it indispensable for evaluating whether a screening model imposes an acceptable clinical review burden.")
    add_bullet("8. Probability Calibration Governs Clinical Trust:", "A model with strong discrimination can still output uncalibrated probabilities. Calibrated probabilities (low ECE and Brier score) are mandatory before risk numbers are displayed to physicians.")
    add_bullet("9. External Validation Tests Cross-Institutional Generalization:", "Internal cross-validation cannot confirm generalizability across different clinical environments. Evaluation on the external Shenzhen PediURF cohort (N = 1,053) proved sensitivity robustness (94.59%) across international imaging equipment.")
    add_bullet("10. Error Auditing Uncovers Representational Shortcuts:", "Systematic false-positive auditing revealed that whole-image CNNs were using open pediatric growth plates as visual shortcuts for fractures, directing subsequent architectural redesign.")
    add_bullet("11. Representation Engineering Beats Parameter Scaling:", "Scaling network capacity from ResNet-18 to DenseNet-121 failed to eliminate pediatric false positives. Decoupling spatial ROI localization from classification resolved the issue while keeping parameter count modest.")
    add_bullet("12. Spatial Bounding Boxes Resolve Physiological Mimics:", "Cropping tightly around candidate lesion coordinates isolates cortical disruption regions from non-fractured growth plate anatomy, eliminating the primary visual confounder in pediatric wrist radiographs.")
    add_bullet("13. Production and Research Models Must Remain Separated:", "Promising experimental architectures must not be deployed to live clinical endpoints until thoroughly validated. Live inference remains locked to the verified production baseline while research advances independently.")
    add_bullet("14. Complete Lineage and Cryptographic Reproducibility Are Mandatory:", "All data splits, preprocessing parameters, and model checkpoints must be cryptographically hashed (SHA-256) and versioned to ensure auditability and prevent temporal data leakage.")

    # ─────────────────────────────────────────────────────────────────────────
    # GOVERNANCE, AUDITING & LINEAGE
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("Governance, Lineage & Cryptographic Provenance")
    add_p("Table 10.1 documents the complete cryptographic lineage and SHA-256 checksums for all production and research model checkpoints.")

    headers_t13 = ["Target Domain", "Checkpoint File Path", "File Size (Bytes)", "SHA-256 Cryptographic Checksum", "Model Status"]
    rows_t13 = [
        ["Cardiovascular Risk", "artifacts/heart_disease/best_model.joblib", "32,636,665", "1651a506476606ae6e8a4b33ed2edded6181d5917b019287c62f43cdb812ef2c", "Production Baseline"],
        ["Diabetes Risk", "artifacts/diabetes/best_model.joblib", "30,193", "65a15bf8674d01ce714033acd38744dc023211c53bcf7f1521fcaf3ab0756af9", "Production Baseline"],
        ["Fracture Baseline", "artifacts/fracture/best_model.pt", "44,788,427", "abe8bc708a44cbe924f448df3654f1f0bfd5964f81b979fae61b446e873583b9", "Production Baseline"],
        ["Fracture Exp 8A", "artifacts/fracture_v2/experiment8.../experiment8a_best.pt", "45,839,207", "eab5ff2910a50665ed5de9626df309130efb0c31a878019408ba95e7aa63fb6d", "Research Best (Frozen)"],
        ["Fracture Exp 2B", "artifacts/fracture_v2/graz_only/best_model.pt", "44,786,059", "5005f3eacf1511064fa09d0adfe46bb8b390c4f098c68b2d35bbb8a5f58d208a", "Research Benchmark"]
    ]
    add_styled_table(headers_t13, rows_t13, [Inches(1.2), Inches(1.8), Inches(1.0), Inches(2.2), Inches(0.8)])

    # ─────────────────────────────────────────────────────────────────────────
    # REFERENCES & SCIENTIFIC LITERATURE
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("References & Scientific Literature")
    refs = [
        "Rajpurkar, P. et al. (2018). 'MURA: Large Dataset for Abnormality Detection in Musculoskeletal Radiographs.' Stanford ML Group, arXiv:1712.06957.",
        "Rahman, M. et al. (2023). 'FracAtlas: A Dataset for Bone Fracture Detection, Localization, and Segmentation.' Nature Scientific Data, 10(1), 521. DOI: 10.1038/s41597-023-02432-4.",
        "Nagy, E. et al. (2022). 'A Pediatric Wrist Trauma X-ray Dataset (GRAZPEDWRI-DX) with Radiologist Annotations.' Nature Scientific Data, 9(1), 444. DOI: 10.1038/s41597-022-01528-6.",
        "Shenzhen Children's Hospital. (2024). 'PediURF: Pediatric Ulna and Radius Fractures Dataset.' Figshare. DOI: 10.6084/m9.figshare.29998954.",
        "Ulianova, S. (2019). 'Cardiovascular Disease Dataset (DV3).' Medical Examination Records Archive, Kaggle Datasets.",
        "National Institute of Diabetes and Digestive and Kidney Diseases. (1990). 'Pima Indians Diabetes Database.' UCI Machine Learning Repository.",
        "Guo, C. et al. (2017). 'On Calibration of Modern Neural Networks.' Proceedings of the 34th International Conference on Machine Learning (ICML 2017), PMLR 70:1321-1330.",
        "Brier, G. W. (1950). 'Verification of Forecasts Expressed in Terms of Probability.' Monthly Weather Review, 78(1), 1-3.",
        "He, K. et al. (2016). 'Deep Residual Learning for Image Recognition.' Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR 2016), pp. 770-778.",
        "Huang, G. et al. (2017). 'Densely Connected Convolutional Networks.' Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition (CVPR 2017), pp. 4700-4708.",
        "Jocher, G. et al. (2023). 'Ultralytics YOLOv8 Architecture and Training Documentation.' Ultralytics LLC.",
        "Selvaraju, R. R. et al. (2017). 'Grad-CAM: Visual Explanations from Deep Networks via Gradient-Based Localization.' IEEE International Conference on Computer Vision (ICCV 2017), pp. 618-626."
    ]
    for r in refs:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        run = p.add_run(r)
        run.font.name = 'Calibri'
        run.font.size = Pt(9.5)

    # ─────────────────────────────────────────────────────────────────────────
    # APPENDIX: DETERMINISTIC NON-LEARNED SAFETY LAYER
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("Appendix: Deterministic Non-Learned Clinical Safety Triage Layer")
    add_p("In acute clinical triage, statistical machine learning models introduce non-zero variance and potential hallucination risks. MediMind incorporates a deterministic, non-learned clinical safety pre-routing layer for unconstrained patient narratives (ai-prediction-service/app/services/general_health_service.py). This layer operates entirely on rule-based regular expression grammars, negation scoping, and anatomical lexicon dictionaries.")
    add_p("On a gold-standard benchmark of 42 clinical vignettes (medimind_advanced_nlp_triage_test_dataset.xlsx), the deterministic safety engine achieved 100.0% emergency red-flag escalation fidelity (12 of 12 acute emergencies escalated immediately), 100.0% negation resolution accuracy (e.g. 'denies chest pain' correctly ignored), 100.0% attribution disambiguation (family history differentiated from patient presentation), and 95.24% clinical entity extraction. This layer functions strictly as a non-learned safety floor that runs prior to any statistical risk model.")

    output_path = "MediMind_DL_DS_Case_Study_v2.docx"
    doc.save(output_path)
    print(f"Successfully generated {output_path} ({os.path.getsize(output_path)} bytes)!")

if __name__ == '__main__':
    build_document()
