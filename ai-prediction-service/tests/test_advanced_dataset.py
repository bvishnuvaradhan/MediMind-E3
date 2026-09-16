import pytest
import pandas as pd
from pathlib import Path
from app.models.general_health.general_health_nlp import GeneralHealthNLPEngine
from app.schemas.prediction_schemas import UrgencyLevel, RiskLevel

def test_evaluate_advanced_excel_dataset():
    dataset_path = (
        Path(__file__).parent.parent
        / "test-dataset"
        / "General Health"
        / "medimind_advanced_nlp_triage_test_dataset.xlsx"
    )
    if not dataset_path.exists():
        pytest.skip("Local test dataset is not available")
    df = pd.read_excel(dataset_path)

    passed_cases = 0
    total_cases = 0
    failed_rows = []

    for idx, row in df.iterrows():
        test_id = row["test_id"]
        text = row["symptom_text"]
        expected_urgency = str(row["expected_urgency"]).strip()
        expected_risk = str(row["expected_risk_level"]).strip()

        if pd.isna(text) or expected_urgency == "VALIDATION_ERROR":
            continue

        result, risk_level, risk_score, confidence = GeneralHealthNLPEngine.evaluate_symptoms(str(text))

        got_urgency = result["urgency"]
        got_risk = risk_level.value

        urgency_correct = (got_urgency == expected_urgency)
        risk_correct = (got_risk == expected_risk)

        total_cases += 1

        if urgency_correct and risk_correct:
            passed_cases += 1
        else:
            failed_rows.append({
                "test_id": test_id,
                "text": text,
                "got_urgency": got_urgency,
                "expected_urgency": expected_urgency,
                "got_risk": got_risk,
                "expected_risk": expected_risk
            })

    accuracy = (passed_cases / total_cases) * 100
    print(f"\nAdvanced Dataset Evaluation Results: {passed_cases}/{total_cases} passed ({accuracy:.1f}%)")
    if failed_rows:
        print("\nFailed rows details:")
        for fail in failed_rows:
            print(f"Row {fail['test_id']}: '{fail['text']}' -> Got ({fail['got_urgency']}, {fail['got_risk']}), Expected ({fail['expected_urgency']}, {fail['expected_risk']})")

    assert len(failed_rows) == 0, f"{len(failed_rows)} test cases failed in advanced dataset: {failed_rows}"
