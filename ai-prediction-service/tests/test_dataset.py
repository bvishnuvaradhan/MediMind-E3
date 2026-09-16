import pytest
import pandas as pd
import math
from app.models.general_health.general_health_nlp import GeneralHealthNLPEngine
from app.schemas.prediction_schemas import UrgencyLevel, RiskLevel

def test_evaluate_excel_dataset():
    dataset_path = "tests/medimind_general_health_test_dataset.xlsx"
    df = pd.read_excel(dataset_path)

    passed_cases = 0
    total_cases = 0
    failed_rows = []

    for idx, row in df.iterrows():
        test_id = row["test_id"]
        text = row["symptom_text"]
        expected_urgency = row["expected_urgency"]
        expected_risk = row["expected_risk_level"]

        # Validation error test case (NaN or empty text)
        if pd.isna(text) or expected_urgency == "VALIDATION_ERROR":
            assert pd.isna(text) or str(text).strip() == ""
            continue

        result, risk_level, risk_score, confidence = GeneralHealthNLPEngine.evaluate_symptoms(str(text))

        urgency_correct = (result["urgency"] == expected_urgency)
        risk_correct = (risk_level.value == expected_risk)
        disclaimer_present = (result["disclaimer"] == GeneralHealthNLPEngine.MANDATORY_DISCLAIMER)

        total_cases += 1

        if urgency_correct and risk_correct and disclaimer_present:
            passed_cases += 1
        else:
            failed_rows.append({
                "test_id": test_id,
                "text": text,
                "got_urgency": result["urgency"],
                "expected_urgency": expected_urgency,
                "got_risk": risk_level.value,
                "expected_risk": expected_risk
            })

    print(f"\nDataset Evaluation Results: {passed_cases}/{total_cases} passed ({passed_cases/total_cases*100:.1f}%)")
    if failed_rows:
        print("Failed rows details:")
        for fail in failed_rows:
            print(f"Row {fail['test_id']}: '{fail['text']}' -> Got ({fail['got_urgency']}, {fail['got_risk']}), Expected ({fail['expected_urgency']}, {fail['expected_risk']})")

    assert len(failed_rows) == 0, f"{len(failed_rows)} dataset test rows failed evaluation: {failed_rows}"
