# Experiment 7 Multi-View Dataset Manifest Summary

**Generated:** 2026-10-06 15:46:05  
**Primary Dataset:** GRAZPEDWRI-DX (Medical University of Graz)  
**External Benchmark Dataset:** PediURF (Shenzhen Children's Hospital)

---

## 1. GRAZPEDWRI-DX Paired Study Cohort

| Split | Total Paired Studies | Fractured Studies (1) | Normal Studies (0) | Fracture Prevalence | Total Radiographs | Manifest File |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Train** | **1620** | 1122 | 498 | 69.26% | 3240 | [`experiment7_train_pairs.csv`](file:///d:/projects/MediMind/ai-prediction-service/artifacts/fracture_v2/experiment7_multiview/experiment7_train_pairs.csv) |
| **Validation** | **348** | 242 | 106 | 69.54% | 696 | [`experiment7_val_pairs.csv`](file:///d:/projects/MediMind/ai-prediction-service/artifacts/fracture_v2/experiment7_multiview/experiment7_val_pairs.csv) |
| **Test (Held-Out)** | **350** | 249 | 101 | 71.14% | 700 | [`experiment7_test_pairs.csv`](file:///d:/projects/MediMind/ai-prediction-service/artifacts/fracture_v2/experiment7_multiview/experiment7_test_pairs.csv) |
| **Total GRAZ** | **2318** | **1613** | **705** | **69.59%** | **4636** | — |

---

## 2. External PediURF Paired Study Cohort

| Split | Total Paired Studies | Distal Fractures | Midshaft Fractures | Proximal Fractures | Manifest File |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **PediURF Held-Out Test** | **1053** | 677 | 265 | 111 | [`pediurf_test_pairs.csv`](file:///d:/projects/MediMind/ai-prediction-service/artifacts/fracture_v2/experiment7_multiview/pediurf_test_pairs.csv) |
| **PediURF Full Cohort** | **5265** | 3374 | 1319 | 572 | [`pediurf_full_pairs.csv`](file:///d:/projects/MediMind/ai-prediction-service/artifacts/fracture_v2/experiment7_multiview/pediurf_full_pairs.csv) |
