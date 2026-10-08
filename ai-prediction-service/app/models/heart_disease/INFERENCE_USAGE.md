# Heart Disease Inference Usage

## Local script

From `ai-prediction-service/`:

```powershell
py scripts/predict_heart_disease.py
```

The script validates a sample patient, loads the Random Forest lazily, applies
threshold `0.4`, and prints the probability, risk category, model version, and
non-diagnostic disclaimer.

## API

Start the service from `ai-prediction-service/`:

```powershell
py -m uvicorn app.main:app --host 127.0.0.1 --port 5007
```

Use Swagger at `http://localhost:5007/docs` and call `POST /api/ai/heart-disease`.
Provide `X-Internal-Service-Key` and the 11 feature fields plus
`family_member_id`. Each successful API prediction is persisted to the shared
AI prediction history and returns common prediction metadata, including a
`prediction_id`.

The response's `risk_score` and `confidence` both use the available positive
class risk probability. `confidence` is not an independently calibrated
confidence score.
