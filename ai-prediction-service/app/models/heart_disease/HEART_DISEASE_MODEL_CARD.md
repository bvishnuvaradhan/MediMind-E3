# Heart Disease Risk Model Card

## Intended use

This model estimates cardiovascular risk from the dataset feature schema. Its
output is an AI-assisted risk estimate, not a diagnosis of heart disease.
Qualified clinicians must interpret results in clinical context.

## Validation

- Data is deduplicated before the stratified 70/15/15 split.
- The decision threshold is selected on validation data only, using recall with
  a minimum specificity target of 0.60.
- The test partition is used only for final evaluation.
- Results include aggregate metrics, calibration, error counts, and subgroup
  metrics for gender, age bands, cholesterol, and glucose categories.

## Limitations

The dataset is historical and its provenance, population representativeness,
and clinical validity for MediMind have not been established. Duplicate removal
can change the observed class distribution, so the training report records raw,
deduplicated, and removed-duplicate class balances. IQR outliers are reported
but not silently clipped.

The current standalone inference route is `POST /api/ai/heart-disease` and
requires the service authentication header. It must not be integrated into
clinical workflows until input validation, external validation, calibration
review, fairness review, and clinician governance are completed.