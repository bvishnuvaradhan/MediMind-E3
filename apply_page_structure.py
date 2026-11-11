import sys

with open('generate_final_audited_case_study.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the beginning of build_case_study from Document Cover up to Phase 1
old_cover_toc_block = text[text.find("# DOCUMENT COVER & HEADER"):text.find('add_phase_header("Phase 1')]

new_cover_toc_block = """# DOCUMENT COVER & HEADER (PAGE 1)
    # ─────────────────────────────────────────────────────────────────────────
    # Top Vertical Spacing for Centered Cover Page
    p_top_space = doc.add_paragraph()
    p_top_space.paragraph_format.space_before = Pt(72)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(14)
    p_title.paragraph_format.line_spacing = 1.15
    r_title = p_title.add_run("MediMind: A Multimodal AI-Driven Healthcare Intelligence and Clinical Decision Support Ecosystem")
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(24.0)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(40)
    p_sub.paragraph_format.line_spacing = 1.20
    r_sub = p_sub.add_run("A Comprehensive 12-Week Industry-Oriented Academic Case Study on Multi-Modal Machine Learning, Leakage Prevention, Localized Multi-View Vision, and Calibrated Clinical Decision Support")
    r_sub.font.name = 'Calibri'
    r_sub.font.size = Pt(13.0)
    r_sub.font.color.rgb = RGBColor(0x44, 0x44, 0x44)

    # Decorative Rule Table
    t_rule = doc.add_table(rows=1, cols=1)
    t_rule.alignment = WD_TABLE_ALIGNMENT.CENTER
    c_rule = t_rule.rows[0].cells[0]
    c_rule.width = Inches(3.5)
    set_cell_background(c_rule, "1B365D")
    set_cell_margins(c_rule, top=10, bottom=10, left=0, right=0)
    p_rule = c_rule.paragraphs[0]
    p_rule.paragraph_format.space_before = Pt(0)
    p_rule.paragraph_format.space_after = Pt(0)

    p_mid_space = doc.add_paragraph()
    p_mid_space.paragraph_format.space_before = Pt(110)

    p_dept = doc.add_paragraph()
    p_dept.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dept.paragraph_format.space_after = Pt(4)
    r_dept = p_dept.add_run("Department of Data Science & Artificial Intelligence")
    r_dept.font.name = 'Calibri'
    r_dept.font.size = Pt(12.0)
    r_dept.font.bold = True
    r_dept.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    p_year = doc.add_paragraph()
    p_year.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_year.paragraph_format.space_after = Pt(3)
    r_year = p_year.add_run("Academic Year 2026–2027")
    r_year.font.name = 'Calibri'
    r_year.font.size = Pt(11.0)
    r_year.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    p_plat = doc.add_paragraph()
    p_plat.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_plat.paragraph_format.space_after = Pt(0)
    r_plat = p_plat.add_run("MediMind Clinical AI Platform")
    r_plat.font.name = 'Calibri'
    r_plat.font.size = Pt(11.0)
    r_plat.font.bold = True
    r_plat.font.color.rgb = RGBColor(0x2B, 0x54, 0x7E)

    # EXACT MANUAL PAGE BREAK AFTER COVER PAGE (PAGE 1 -> PAGE 2)
    doc.add_page_break()

    # ─────────────────────────────────────────────────────────────────────────
    # PAGE 2 — TABLE OF CONTENTS & LIFECYCLE ARCHITECTURE
    # ─────────────────────────────────────────────────────────────────────────
    p_toc_head = doc.add_paragraph()
    p_toc_head.paragraph_format.space_before = Pt(0)
    p_toc_head.paragraph_format.space_after = Pt(2)
    p_toc_head.paragraph_format.keep_with_next = True
    r_th = p_toc_head.add_run("Table of Contents")
    r_th.font.name = 'Calibri'
    r_th.font.size = Pt(12.5)
    r_th.font.bold = True
    r_th.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    # Two-Column Compact Table of Contents to comfortably fit on Page 2
    col1_toc = [
        "Executive Summary: The Data Science Paradigm in Healthcare",
        "7-Phase / 12-Week Data Science Lifecycle Architecture",
        "Phase 1 — Problem Identification (Weeks 1–2)",
        "    1.1 Project Title & System Scope",
        "    1.2 Problem Statement & Clinical Framing",
        "    1.3 Input Vectors, Targets & Boundaries",
        "    1.4 Translational Bottleneck",
        "    1.5 Stakeholder Governance Matrix",
        "    1.6 Core Analytical Objectives",
        "    1.7 Asymmetric Loss Formulation & KPIs",
        "    1.8 Phase 1 Deliverables",
        "Phase 2 — Data Collection & Integration (Weeks 3–4)",
        "    2.1 Objective & Multi-Modal Provenance",
        "    2.2 Data Sources & Provenance Audits",
        "    2.3 Tabular Data Schemas & Dictionaries",
        "    2.4 Radiographic Dataset Landscape",
        "    2.5 Clinical NLP Cohort Architecture",
        "    2.6 Data Integration & Cohort Isolation",
        "    2.7 Tools & Technology Stack",
        "    2.8 Phase 2 Deliverables",
        "Phase 3 — Data Preparation (Weeks 5–6)",
        "    3.1 Methodology & Modality Isolation",
        "    3.2 Heart Disease Cleaning (-3,820 Rows)",
        "    3.3 Diabetes Train-Only Imputation",
        "    3.4 Musculoskeletal Radiograph Datasets",
        "    3.5 Radiographic Standardization",
        "    3.6 Clinical NLP Preparation",
        "    3.7 Phase 3 Deliverables",
        "Phase 4 — Exploratory Data Analysis (Weeks 7–8)",
        "    4.1 Methodology & Modality Isolation",
        "    4.2 Heart Disease EDA & Confounders",
        "    4.3 Diabetes Skewness & Insulin Profiling",
        "    4.4 Musculoskeletal EDA Characteristics",
        "    4.5 Pediatric Growth Plate Confounders",
        "    4.6 Phase 4 Deliverables"
    ]

    col2_toc = [
        "Phase 5 — Feature Engineering (Weeks 8–9)",
        "    5.1 Representation Learning across Modalities",
        "    5.2 Heart Hemodynamic Features (Pulse Pres.)",
        "    5.3 Diabetes Metabolic Normalization",
        "    5.4 Four-Stage Radiographic Progression",
        "    5.5 Deterministic Clinical NLP Representation",
        "    5.6 Phase 5 Deliverables",
        "Phase 6 — Model Building (Weeks 10–11)",
        "    6.1 Experimental Design & Baselines",
        "    6.2 Classical Tabular Benchmarking",
        "    6.3 Decision Threshold Optimization (tau)",
        "    6.4 Fracture Progression (Exp 1 to 8A)",
        "    6.5 DualViewROIResNet18 Architecture",
        "    6.6 Operating Threshold Hierarchy",
        "    6.7 Two-Stage Transfer Learning",
        "    6.8 Master Model Comparison Table",
        "    6.9 Hardware & Training Environment",
        "Phase 7 — Evaluation & Interpretation (Wk 12)",
        "    7.1 Multi-Dimensional Evaluation Tensor",
        "    7.2 95% Wilson Confidence Intervals",
        "    7.3 Multi-View Synergy & 24 Lateral Rescues",
        "    7.4 Pediatric Specificity Stress Test (87.25%)",
        "    7.5 Shenzhen PediURF External Test (94.59%)",
        "    7.6 Probability Calibration (Brier / ECE)",
        "    7.7 Error Auditing & Grad-CAM Visuals",
        "    7.8 Phase 7 Deliverables",
        "Section 8 — System Architecture & Phase 20 SOA",
        "Section 9 — Ethical, Privacy & AI Governance",
        "Section 10 — Operational Baseline Reconciliation",
        "Section 11 — Academic Assessment & Defense",
        "Section 12 — 14 Foundational Data Science Insights",
        "Section 13 — Cryptographic Lineage (SHA-256)",
        "Section 14 — Peer-Reviewed Literature References",
        "Appendix — Deterministic Safety Triage Layer"
    ]

    t_toc = doc.add_table(rows=max(len(col1_toc), len(col2_toc)), cols=2)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx in range(len(t_toc.rows)):
        c1 = t_toc.rows[r_idx].cells[0]
        c2 = t_toc.rows[r_idx].cells[1]
        c1.width = Inches(3.38)
        c2.width = Inches(3.38)
        set_cell_margins(c1, top=8, bottom=8, left=20, right=20)
        set_cell_margins(c2, top=8, bottom=8, left=20, right=20)
        
        txt1 = col1_toc[r_idx] if r_idx < len(col1_toc) else ""
        txt2 = col2_toc[r_idx] if r_idx < len(col2_toc) else ""
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        p1.paragraph_format.line_spacing = 1.02
        r1 = p1.add_run(txt1)
        r1.font.name = 'Calibri'
        r1.font.size = Pt(7.5)
        if txt1 and not txt1.startswith("    "):
            r1.font.bold = True
            r1.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
        else:
            r1.font.color.rgb = RGBColor(0x44, 0x44, 0x44)

        p2 = c2.paragraphs[0]
        p2.paragraph_format.space_after = Pt(0)
        p2.paragraph_format.line_spacing = 1.02
        r2 = p2.add_run(txt2)
        r2.font.name = 'Calibri'
        r2.font.size = Pt(7.5)
        if txt2 and not txt2.startswith("    "):
            r2.font.bold = True
            r2.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
        else:
            r2.font.color.rgb = RGBColor(0x44, 0x44, 0x44)

    # 7-PHASE ARCHITECTURE TABLE (PAGE 2 - SECOND COMPONENT)
    p_lc_head = doc.add_paragraph()
    p_lc_head.paragraph_format.space_before = Pt(8)
    p_lc_head.paragraph_format.space_after = Pt(2)
    p_lc_head.paragraph_format.keep_with_next = True
    r_lch = p_lc_head.add_run("7-Phase / 12-Week Data Science Lifecycle Architecture")
    r_lch.font.name = 'Calibri'
    r_lch.font.size = Pt(11.0)
    r_lch.font.bold = True
    r_lch.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)

    p_lc_intro = doc.add_paragraph()
    p_lc_intro.paragraph_format.space_after = Pt(2)
    r_lci = p_lc_intro.add_run("Table 0.1 outlines the chronological 12-week implementation timeline and primary academic deliverables spanning the complete MediMind data science lifecycle.")
    r_lci.font.name = 'Calibri'
    r_lci.font.size = Pt(8.5)
    r_lci.font.color.rgb = RGBColor(0x44, 0x44, 0x44)

    headers_phase = ["Phase", "Title", "Timeline", "Core Data Science Activities & Deliverables"]
    rows_phase = [
        ["1", "Problem Identification", "Weeks 1–2", "Clinical framing, stakeholder matrix, asymmetric loss formulation (C_FN >> C_FP), and KPI hierarchy."],
        ["2", "Data Collection & Integration", "Weeks 3–4", "Multi-modal dataset inventory (Cardio 68k, Pima 768, FracAtlas, MURA, GRAZ, PediURF), licensing audits, and cohort isolation."],
        ["3", "Data Preparation", "Weeks 5–6", "Cryptographic duplicate excision (-3,820 rows), train-only median biological zero imputation, and 100% patient-level isolation."],
        ["4", "Exploratory Data Analysis", "Weeks 7–8", "Statistical profiling, smoking-age confounding paradox, metabolic skewness, and discovery of growth plates as false-positive mimics."],
        ["5", "Feature Engineering", "Weeks 8–9", "Hemodynamic transformations (Pulse Pressure, BMI), 4-stage vision progression, and localized ROI bounding-box cropping."],
        ["6", "Model Building & Comparison", "Weeks 10–11", "Tabular benchmarking (LR, RF, MLP), threshold optimization (tau), DualViewROIResNet18 architecture, and master results table."],
        ["7", "Evaluation & Clinical Interpretation", "Week 12", "95% Wilson CIs, 24 lateral rescues, normal control stress testing (87.25% spec), PediURF external validation (94.59% sens), and ECE calibration."]
    ]
    add_styled_table(headers_phase, rows_phase, [Inches(0.55), Inches(1.75), Inches(1.05), Inches(3.42)])

    # EXACT MANUAL PAGE BREAK AFTER LIFECYCLE ARCHITECTURE (PAGE 2 -> PAGE 3)
    doc.add_page_break()

    # ─────────────────────────────────────────────────────────────────────────
    # PAGE 3 — EXECUTIVE SUMMARY
    # ─────────────────────────────────────────────────────────────────────────
    add_h1("Executive Summary: The Data Science Paradigm in Healthcare")
    add_p("Modern clinical predictive modeling faces a severe translational bottleneck: while deep neural networks and complex ensemble algorithms frequently report high benchmark discrimination on public datasets, they routinely fail when transitioned to acute hospital environments. In healthcare, algorithmic complexity is fundamentally subordinate to data quality, representation fidelity, and probabilistic calibration. A high-capacity neural network trained on leaked patient records or poorly calibrated probabilities represents an active clinical hazard, generating misleading prognostic confidence that compromises patient safety.")
    add_p("The MediMind project embodies a rigorous, end-to-end Data Science lifecycle developed across 12 structured implementation weeks. Operating as an intelligent healthcare decision-support ecosystem, MediMind ingests multi-modal patient data—spanning structured hemodynamic surveys (64,963 clean records), metabolic diagnostic biomarkers (768 records), musculoskeletal radiographs (7,473 trauma studies), and unstructured clinical narratives—to deliver non-diagnostic, calibrated risk stratification across four specialized domains:")
    add_bullet("Cardiovascular Disease Risk:", "Estimating binary cardiovascular disease risk P(CVD=1 | X) from 11 routine hemodynamic, anthropometric, and metabolic indicators.")
    add_bullet("Type-2 Diabetes Metabolic Risk:", "Quantifying metabolic onset probability P(Diabetes=1 | X) across 8 clinical diagnostic biomarkers under strict zero-leakage protocols.")
    add_bullet("Musculoskeletal Fracture Detection:", "Identifying acute cortical bone disruptions P(Fracture=1 | I) in pediatric and adult wrist radiographs using dual-view region-of-interest attention.")
    add_bullet("General Health & Clinical NLP Triage:", "Extracting acute symptoms, parsing clinical negations, and flagging emergency red-flag conditions from free-text patient narratives.")
    add_p("This academic case study documents how disciplined data science principles governed every phase of development: enforcing cryptographic duplicate excision (-3,820 rows), train-only biological zero imputation, patient-level and study-level partition grouping to eliminate multi-view data leakage, inductive representation engineering that mitigated pediatric growth plate confounding, asymmetric clinical loss threshold optimization (tuning tau below 0.50 to enforce sensitivity floors), Brier score calibration, and multi-center external validation on 1,053 independent trauma studies.")

    # EXACT MANUAL PAGE BREAK AFTER EXECUTIVE SUMMARY (PAGE 3 -> PAGE 4 / PHASE 1)
    doc.add_page_break()

    # ─────────────────────────────────────────────────────────────────────────
    # """

text = text.replace(old_cover_toc_block, new_cover_toc_block)

# Now, add page breaks before every Phase and every Section:
# Phases 2 to 7
for p_num in range(2, 8):
    old_call = f'add_phase_header("Phase {p_num}'
    # insert doc.add_page_break() before add_phase_header
    new_call = f'doc.add_page_break()\n    add_phase_header("Phase {p_num}'
    text = text.replace(old_call, new_call)

# Sections 8 to 14 and Appendix
for sec_num in range(8, 15):
    old_call = f'add_h1("Section {sec_num}'
    new_call = f'doc.add_page_break()\n    add_h1("Section {sec_num}'
    text = text.replace(old_call, new_call)

old_app = 'add_h1("Appendix —'
new_app = 'doc.add_page_break()\n    add_h1("Appendix —'
text = text.replace(old_app, new_app)

with open('generate_final_audited_case_study.py', 'w', encoding='utf-8') as f:
    f.write(text)

print("Successfully restructured opening layout and added manual page breaks before all phases and sections!")
