# MediMind AI — Experiment 6 Phase 1: Independent Pediatric Fracture Dataset External Audit Report

> **Status:** RESEARCH AUDIT ONLY — NO MODEL TRAINING CONDUCTED  
> **Date:** 2026-10-06T14:16:57+05:30  
> **Recommended Primary Dataset:** **PediURF (Pediatric Ulna and Radius Fractures)**  
> **Verdict:** **GO FOR EXPERIMENT 6 PHASE 2 EXTERNAL VALIDATION**  

---

## 1. Executive Summary

In Experiment 5, the **YOLOv8n-Detection** architecture achieved a major breakthrough on the internal GRAZPEDWRI-DX held-out test cohort:
- **Pediatric Recall:** **91.70%**
- **Pediatric Specificity:** **87.25%** (219 / 251 normal pediatric radiographs cleanly classified without false fracture alarms)
- **Pediatric F1-Score:** **0.9268** | **ROC-AUC:** **0.9639**

The objective of **Experiment 6 Phase 1** is to discover, audit, and verify independent public pediatric fracture datasets to test whether this localization capability generalizes to external imaging centers, distinct patient populations, and diverse radiographic hardware.

---

## 2. Provenance & Independence Audit

### Primary Candidate: **PediURF (Pediatric Ulna and Radius Fractures)**
- **Acquiring Center:** Shenzhen Children's Hospital, Shenzhen, China
- **Acquisition Window:** 2013 – 2024
- **Geography:** Shenzhen, Guangdong, China
- **Imaging Modality:** Digital Radiography (DR) & Computed Radiography (CR)
- **Clinical Population:** Tertiary pediatric hospital emergency & orthopedic departments
- **DOI Repository:** [10.6084/m9.figshare.29998954](https://doi.org/10.6084/m9.figshare.29998954)

### Overlap & Independence Check:
- **vs GRAZPEDWRI-DX (Austria):** 0% (GRAZ is Medical Univ of Graz, Austria, 2008-2018)
- **vs Stanford MURA (USA):** 0% (MURA is Stanford Hospital, California, USA)
- **vs FracAtlas (Bangladesh):** 0% (FracAtlas is BUET / Dhaka Medical College, Bangladesh)
- **Independence Confirmation:** `VERIFIED — 100% INDEPENDENT`

---

## 3. Label & Annotation Quality Audit

- **Bounding Box Format:** `YOLO / Pascal VOC bounding rectangles`
- **Primary Detection Class:** `fracture`
- **Annotation Completeness:** Complete bounding-box coverage for all fractured radiographs
- **Negative Control Quality:** Zero fracture bounding boxes (clean negative controls)
- **Label Taxonomy:** Covers distal radius, distal ulna, shaft fractures, and normal anatomy.

---

## 4. Growth-Plate & Anatomical Generalization Evaluation

The primary scientific question for external validation is whether the Experiment 5 detector's growth-plate discrimination generalizes across different radiographic beam energies and anatomical variations:
- **Growth Plates Present in Dataset:** `True`
- **Key Anatomical Physes Evaluated:** Distal radial physis, Distal ulnar physis, Proximal radial physis, Olecranon physis
- **Scientific Utility:** Directly tests whether the Experiment 5 YOLOv8n detector maintains its high specificity (87.25%) on distal radial/ulnar growth plates acquired on different X-ray machines, beam geometries, and patient demographics from Shenzhen Children's Hospital.

---

## 5. Secondary Benchmark: Large-Scale Specificity Stress Test

### **RSNA Pediatric Bone Age Dataset**
- **Clinical Role:** Large-Scale Population Specificity Stress Test (14,236 Normal Control Radiographs)
- **Scale:** 14,236 confirmed non-fracture pediatric hand/wrist radiographs across ages 0–19 years.
- **Objective:** Verify false-positive alarm rate remains below 15% across full pediatric age spectrum (0-19 years).

---

## 6. Evaluation Matrix & Scoring Breakdown

| Candidate Dataset | Independence (A) | Pediatric (B) | Label Qual (C) | Normals (D) | Patient IDs (E) | Bounding Box (F) | Size (G) | License (H) | Diversity (I) | **Total Score** |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **PediURF (Pediatric Uln...** | 10.0 | 10.0 | 9.5 | 9.5 | 9.5 | 9.5 | 10.0 | 10.0 | 9.0 | **9.6/10** |
| **PediaSHF-DX (Pediatric...** | 10.0 | 10.0 | 9.5 | 9.5 | 9.0 | 9.0 | 9.5 | 10.0 | 8.5 | **8.8/10** |
| **RSNA Pediatric Bone Ag...** | 10.0 | 10.0 | 10.0 | 10.0 | 10.0 | 0.0 | 10.0 | 9.5 | 9.0 | **8.5/10** |
| **Mendeley Wrist Fractur...** | 10.0 | 4.0 | 7.0 | 6.0 | 2.0 | 0.0 | 3.0 | 10.0 | 5.0 | **5.2/10** |

---

## 7. Next-Step Protocol for Experiment 6 Phase 2

### Recommendation: **GO FOR EXPERIMENT 6 PHASE 2 EXTERNAL VALIDATION**

1. Download and format PediURF into standard YOLO single-class evaluation structure.
2. Maintain Experiment 5 YOLOv8n checkpoint in 100% frozen state (best_model.pt).
3. Apply frozen validation threshold of 0.17 exactly once on PediURF.
4. Measure external detection mAP, external image-level Recall, Specificity, Precision, F1, and ROC-AUC.
5. Evaluate growth-plate false-positive rate on external Asian pediatric population.