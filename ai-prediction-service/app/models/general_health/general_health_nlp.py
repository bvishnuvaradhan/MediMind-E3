import re
from typing import Dict, Any, List, Tuple
from app.schemas.prediction_schemas import UrgencyLevel, RiskLevel

class GeneralHealthNLPEngine:
    """
    Clinical Decision Support Triage Engine for General Health Assessment.
    Analyzes free-text patient symptoms and enforces conservative, safety-first emergency rules.
    """
    MODEL_NAME = "general_health_nlp"
    MODEL_VERSION = "1.0.0"
    MANDATORY_DISCLAIMER = "AI-assisted assessment. This is not a medical diagnosis. Consult a qualified healthcare professional."

    # 🚨 Red-Flag Emergency Keywords (Err on the side of safety)
    RED_FLAG_PATTERNS = [
        (r"\bchest\s+pain\b", "Chest pain or tightness"),
        (r"\bchest\s+tightness\b", "Chest pain or tightness"),
        (r"\bchest\s+pressure\b", "Chest pain or tightness"),
        (r"\btightness\s+in\s+chest\b", "Chest pain or tightness"),
        (r"\bshortness\s+of\s+breath\b", "Difficulty breathing / dyspnea"),
        (r"\bdifficulty\s+breathing\b", "Difficulty breathing / dyspnea"),
        (r"\bcan'?t\s+breathe\b", "Difficulty breathing / dyspnea"),
        (r"\bstroke\b", "Possible stroke sign"),
        (r"\bface\s+droop(ing)?\b", "Possible stroke sign (facial drooping)"),
        (r"\bslurred\s+speech\b", "Possible stroke sign (slurred speech)"),
        (r"\bsudden\s+numbness\b", "Sudden neurological numbness/weakness"),
        (r"\bparalysis\b", "Sudden neurological numbness/weakness"),
        (r"\banaphylaxis\b", "Severe allergic reaction / anaphylaxis"),
        (r"\bthroat\s+closing\b", "Severe allergic reaction / respiratory compromise"),
        (r"\bcoughing\s+(up\s+)?blood\b", "Hemoptysis (coughing blood)"),
        (r"\bsudden\s+loss\s+of\s+vision\b", "Sudden vision loss"),
        (r"\bstiff\s+neck\b", "Stiff neck (possible meningeal sign)"),
        (r"\bunconscious(ness)?\b", "Loss of consciousness / syncope"),
        (r"\bpassed\s+out\b", "Loss of consciousness / syncope"),
        (r"\bsevere\s+trauma\b", "Severe physical trauma"),
        (r"\bhead\s+injury\b", "Head injury")
    ]

    # 🟡 Moderate-Risk Symptom Patterns
    MODERATE_PATTERNS = [
        (r"\b(high\s+)?fever\b", "Fever / elevated body temperature"),
        (r"\btemperature\s+(of\s+)?(10[0-9]|99)\b", "Elevated temperature"),
        (r"\bpersistent\s+cough\b", "Persistent cough"),
        (r"\bvomiting\b", "Vomiting / gastrointestinal distress"),
        (r"\bsevere\s+headache\b", "Severe headache"),
        (r"\babdominal\s+pain\b", "Abdominal pain"),
        (r"\bstomach\s+pain\b", "Stomach pain"),
        (r"\bjoint\s+(pain|swelling)\b", "Joint inflammation/pain"),
        (r"\burinary\s+burning\b", "Urinary tract symptom"),
        (r"\bear\s+pain\b", "Ear pain/infection sign"),
        (r"\brash\b", "Skin rash")
    ]

    # 🟢 Minor / Self-Care Symptom Patterns
    MINOR_PATTERNS = [
        (r"\bmild\s+headache\b", "Mild headache"),
        (r"\brunny\s+nose\b", "Runny nose / nasal congestion"),
        (r"\bsneezing\b", "Sneezing"),
        (r"\bmild\s+fatigue\b", "Mild fatigue"),
        (r"\bsore\s+throat\b", "Sore throat"),
        (r"\bminor\s+scratch\b", "Minor abrasion / scratch"),
        (r"\bmild\s+muscle\s+ache\b", "Mild muscle soreness")
    ]

    @classmethod
    def evaluate_symptoms(cls, text: str) -> Tuple[Dict[str, Any], RiskLevel, float, float]:
        """
        Processes text and returns (result_dict, risk_level, risk_score, confidence).
        """
        clean_text = text.lower().strip()

        extracted_red_flags = cls._extract_matches(clean_text, cls.RED_FLAG_PATTERNS)
        extracted_moderate = cls._extract_matches(clean_text, cls.MODERATE_PATTERNS)
        extracted_minor = cls._extract_matches(clean_text, cls.MINOR_PATTERNS)

        all_extracted_labels = list(set(
            [desc for _, desc in extracted_red_flags] +
            [desc for _, desc in extracted_moderate] +
            [desc for _, desc in extracted_minor]
        ))

        # Rule 1: Emergency Red Flags (Highest Priority - Err on side of safety)
        if extracted_red_flags:
            urgency = UrgencyLevel.EMERGENCY
            risk_level = RiskLevel.HIGH
            risk_score = 0.94
            confidence = 0.92
            
            concerns = [f"Possible urgent medical condition ({desc})" for _, desc in extracted_red_flags]
            guidance = (
                "CRITICAL ALERT: Your symptoms include potential red-flag medical indicators. "
                "Immediate emergency medical evaluation (e.g., calling emergency services or going to the nearest emergency department) is strongly advised. "
                "Do not delay seeking clinical care."
            )

        # Rule 2: Moderate Symptoms
        elif extracted_moderate:
            urgency = UrgencyLevel.MEDICAL_EVALUATION_RECOMMENDED
            risk_level = RiskLevel.MEDIUM
            risk_score = 0.60
            confidence = 0.85

            concerns = [f"Possible concern: {desc}" for _, desc in extracted_moderate]
            guidance = (
                "Medical evaluation is recommended. Monitor your symptoms closely, ensure adequate rest and hydration, "
                "and consult a physician or healthcare provider for a thorough examination."
            )

        # Rule 3: Minor Symptoms
        elif extracted_minor:
            urgency = UrgencyLevel.SELF_CARE
            risk_level = RiskLevel.LOW
            risk_score = 0.25
            confidence = 0.82

            concerns = [f"Possible minor concern: {desc}" for _, desc in extracted_minor]
            guidance = (
                "General self-care and symptom monitoring recommended. Stay hydrated and rest. "
                "If symptoms worsen or persist beyond a few days, consult a healthcare professional."
            )

        # Rule 4: General Fallback when specific keywords aren't matched directly
        else:
            urgency = UrgencyLevel.MEDICAL_EVALUATION_RECOMMENDED
            risk_level = RiskLevel.MEDIUM
            risk_score = 0.45
            confidence = 0.65

            concerns = ["Unspecified general health symptom presentation"]
            guidance = (
                "General health concern noted. A consultation with a qualified medical doctor is recommended "
                "to perform a physical assessment and provide personalized medical advice."
            )

        if not all_extracted_labels:
            all_extracted_labels = ["General symptom description"]

        result = {
            "possibleConcerns": concerns,
            "urgency": urgency.value,
            "guidance": guidance,
            "symptomsExtracted": all_extracted_labels,
            "disclaimer": cls.MANDATORY_DISCLAIMER
        }

        return result, risk_level, risk_score, confidence

    @staticmethod
    def _extract_matches(text: str, patterns: List[Tuple[str, str]]) -> List[Tuple[str, str]]:
        matches = []
        for pattern, label in patterns:
            if re.search(pattern, text):
                matches.append((pattern, label))
        return matches
