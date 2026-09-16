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

- Delimiter: semicolon (`;`)
- Missing values: none in the inspected file
- Target distribution: 0 = 34,742; 1 = 34,041
- Current preparation: coerce values to numeric, drop rows missing any feature or target, and preserve the binary target
- Train/validation/test split: not selected yet
- Model: not selected or trained yet

## Source and limitations

The dataset source and license terms are not documented in the current
repository, so provenance and redistribution terms must be confirmed before
production or publication use.

This is a historical clinical dataset and may not represent current clinical
practice or the MediMind population. Any future model requires leakage review,
reproducible splits, class-aware evaluation, and clinician review before use.