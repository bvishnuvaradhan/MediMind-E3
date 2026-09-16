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
        (r"\btightness\s+(in\s+(my\s+|the\s+)?)?chest\b", "Chest pain or tightness"),
        (r"\bshortness\s+of\s+breath\b", "Difficulty breathing / dyspnea"),
        (r"\bdifficulty\s+breathing\b", "Difficulty breathing / dyspnea"),
        (r"\bcan'?t\s+breathe\b", "Difficulty breathing / dyspnea"),
        (r"\bcan\s*not\s+breathe\b", "Difficulty breathing / dyspnea"),
        (r"\bstroke\b", "Possible stroke sign"),
        (r"\bface\s+droop(ing)?\b", "Possible stroke sign (facial drooping)"),
        (r"\bslurred\s+speech\b", "Possible stroke sign (slurred speech)"),
        (r"\bsudden\s+weakness\b", "Sudden neurological weakness / stroke sign"),
        (r"\bweakness\s+(on|in)\s+.*(side|arm|leg)\b", "Sudden neurological weakness"),
        (r"\bsudden\s+numbness\b", "Sudden neurological numbness/weakness"),
        (r"\bparalysis\b", "Sudden neurological numbness/weakness"),
        (r"\bsudden\s+loss\s+of\s+vision\b", "Sudden vision loss"),
        (r"\bserious\s+fall\b", "Serious fall / trauma indicator"),
        (r"\bsevere\s+neck\s+pain\b", "Severe neck pain / spinal trauma"),
        (r"\bhead\s+injury\b", "Head injury"),
        (r"\bsevere\s+trauma\b", "Severe physical trauma"),
        (r"\bunconscious(ness)?\b", "Loss of consciousness / syncope"),
        (r"\bpassed\s+out\b", "Loss of consciousness / syncope"),
        (r"\banaphylaxis\b", "Severe allergic reaction / anaphylaxis"),
        (r"\bsevere\s+allergic\s+reaction\b", "Severe allergic reaction"),
        (r"\bswelling\s+of\s+(my\s+|the\s+)?throat\b", "Airway swelling / anaphylaxis"),
        (r"\bthroat\s+closing\b", "Severe allergic reaction / respiratory compromise"),
        (r"\bcoughing\s+(up\s+)?blood\b", "Hemoptysis (coughing blood)"),
        (r"\bstiff\s+neck\b", "Stiff neck (possible meningeal sign)")
    ]

    # 🟡 Moderate-Risk Symptom Patterns
    MODERATE_PATTERNS = [
        (r"\b(high\s+)?fever\b", "Fever / elevated body temperature"),
        (r"\btemperature\s+(is|of)?\s*(10[0-9]|99|\d+(\.\d+)?\s*degrees?)\b", "Elevated temperature"),
        (r"\bpersistent\s+cough\b", "Persistent cough"),
        (r"\bcough\s+for\s+.*\b", "Persistent cough"),
        (r"\bvomiting\b", "Vomiting / gastrointestinal distress"),
        (r"\bsevere\s+headache\b", "Severe headache"),
        (r"\babdominal\s+pain\b", "Abdominal pain"),
        (r"\bstomach\s+pain\b", "Stomach pain"),
        (r"\bjoint\s+(pain|swelling|symptoms)\b", "Joint inflammation/pain"),
        (r"\bswollen\s+and\s+painful\b", "Swollen and painful joint/limb"),
        (r"\bpersistent\s+sore\s+throat\b", "Persistent sore throat"),
        (r"\bdifficulty\s+swallowing\b", "Difficulty swallowing"),
        (r"\burinary\s+burning\b", "Urinary tract symptom"),
        (r"\bear\s+pain\b", "Ear pain/infection sign"),
        (r"\brash\b", "Skin rash")
    ]

    # 🟢 Minor / Self-Care Symptom Patterns
    MINOR_PATTERNS = [
        (r"\bmild\s+headache\b", "Mild headache"),
        (r"\bheadache\b", "Headache"),
        (r"\brunny\s+nose\b", "Runny nose / nasal congestion"),
        (r"\bsneezing\b", "Sneezing"),
        (r"\bmild(ly)?\s+tired\b", "Mild fatigue"),
        (r"\bslight(ly)?\s+tired\b", "Mild fatigue"),
        (r"\bslight\s+muscle\s+soreness\b", "Mild muscle soreness"),
        (r"\bmild\s+muscle\s+ache\b", "Mild muscle soreness"),
        (r"\bmild\s+stomach\s+discomfort\b", "Mild stomach discomfort"),
        (r"\bsore\s+throat\b", "Sore throat"),
        (r"\bminor\s+scratch\b", "Minor abrasion / scratch"),
        (r"\bfeel\s+okay\b", "No significant symptoms reported"),
        (r"\bno\s+(other\s+)?symptoms\b", "No significant symptoms reported")
    ]

    @classmethod
    def evaluate_symptoms(cls, text: str) -> Tuple[Dict[str, Any], RiskLevel, float, float]:
        """
        Processes text and returns (result_dict, risk_level, risk_score, confidence).
        Safety Priority Rule: Emergency > Moderate > Minor > General Fallback.
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

        # Rule 1: Emergency Red Flags (Highest Priority - Red Flags ALWAYS win regardless of minor qualifiers)
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

        # Rule 3: Minor Symptoms / Self-Care
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

        # Rule 4: General Fallback
        else:
            urgency = UrgencyLevel.SELF_CARE if any(w in clean_text for w in ["okay", "good", "fine", "normal"]) else UrgencyLevel.MEDICAL_EVALUATION_RECOMMENDED
            risk_level = RiskLevel.LOW if urgency == UrgencyLevel.SELF_CARE else RiskLevel.MEDIUM
            risk_score = 0.20 if urgency == UrgencyLevel.SELF_CARE else 0.45
            confidence = 0.70

            concerns = ["General symptom description"]
            guidance = (
                "General self-care recommended. Consult a physician if symptoms worsen or persist."
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
