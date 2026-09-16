# Heart Disease Dataset Notes

## Dataset

- Name: Cardiovascular Disease Dataset (DV3)
- Local file: `test-dataset/Heart Disease/cardiovascular_diseases_dv3.csv`
- Records: 68,783
- Features: 11 numeric features
- Target: `CARDIO_DISEASE`, already encoded as 0 or 1

## Feature contract

`AGE`, `GENDER`, `HEIGHT`, `WEIGHT`, `AP_HIGH`, `AP_LOW`, `CHOLESTEROL`,
`GLUCOSE`, `SMOKE`, `ALCOHOL`, and `PHYSICAL_ACTIVITY`.

## Inspection results

- Delimiter: comma (standard CSV)
- Missing values: none in the inspected file
- Target distribution: 0 = 34,742; 1 = 34,041
- Exact duplicate rows: 3,820; they are removed before splitting to reduce leakage
- Current preparation: coerce values to numeric, remove invalid targets and exact duplicates, preserve the binary target
- Outliers: retained for now and reported with the IQR rule; no silent clipping is applied
- Scaling: `StandardScaler` is used in Logistic Regression and MLP pipelines; Random Forest uses raw numeric features
- Train/validation/test split: stratified 70% / 15% / 15% with random seed 42, producing 45,474 / 9,744 / 9,745 rows after deduplication
- Models: Logistic Regression, Random Forest, and a small regularized MLP baseline
- Metrics: recall, specificity, precision, F1, ROC-AUC, PR-AUC, Brier score, and confusion matrix
- Baseline result: Random Forest selected by validation ROC-AUC (0.7944); test ROC-AUC was 0.7961
- Local artifacts: saved under `artifacts/heart_disease/` and ignored by Git

## Source and limitations

The dataset source and license terms are not documented in the current
repository, so provenance and redistribution terms must be confirmed before
production or publication use.

This is a historical clinical dataset and may not represent current clinical
practice or the MediMind population. Any future model requires leakage review,
reproducible splits, class-aware evaluation, and clinician review before use.