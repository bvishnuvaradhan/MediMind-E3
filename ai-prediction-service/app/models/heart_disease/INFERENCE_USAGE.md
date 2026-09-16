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
`family_member_id`. The route is standalone: it does not yet persist a
prediction record or integrate with the frontend.