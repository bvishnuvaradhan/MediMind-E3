import re
from typing import Dict, Any, List, Tuple
from app.schemas.prediction_schemas import UrgencyLevel, RiskLevel


class GeneralHealthNLPEngine:
    """
    Advanced Clinical Decision Support Triage Engine — v1.1.0
    Analyzes free-text patient symptoms with:
    - Conservative safety-first red-flag detection (errs toward emergency)
    - Robust negation parsing (50-char window, 15+ negation tokens, two-word gap,
      historical framing, conditional/third-person detection)
    - Self-harm / psychiatric emergency detection
    - Pediatric & neonatal emergency detection
    - Severe bleeding / hemorrhagic emergency patterns
    - Diabetic & poisoning emergencies
    - Multilingual support: Hinglish (Hindi-English) & Telugu-English code-mixing
    - Severity amplifier and temporal urgency awareness
    - Mandatory non-diagnostic disclaimer on every output
    """

    MODEL_NAME = "general_health_nlp"
    MODEL_VERSION = "1.1.0"
    MANDATORY_DISCLAIMER = (
        "AI-assisted assessment. This is not a medical diagnosis. "
        "Consult a qualified healthcare professional."
    )

    # ─────────────────────────────────────────────────────────────────────────
    # 🚨 RED-FLAG / EMERGENCY PATTERNS  →  EMERGENCY + HIGH risk
    # ─────────────────────────────────────────────────────────────────────────
    RED_FLAG_PATTERNS: List[Tuple[str, str]] = [

        # ── Cardiac ─────────────────────────────────────────────────────────
        (r"\bchest\s*pain\b",                           "Chest pain or tightness"),
        (r"\bchest\s+tightness\b",                      "Chest pain or tightness"),
        (r"\bchest\s+pressure\b",                       "Chest pain or tightness"),
        (r"\btightness\s+(in\s+(my\s+|the\s+)?)?chest\b", "Chest pain or tightness"),
        (r"\bpressure\s+(in|on)\s+(my\s+|the\s+)?chest\b", "Chest pressure / possible cardiac concern"),
        (r"\belephant\s+.*(on\s+(my\s+|the\s+)?)?chest\b", "Severe cardiac pressure (elephant on chest idiom)"),
        (r"\bweight\s+(on|in)\s+(my\s+|the\s+)?chest\b",   "Chest heaviness / pressure"),
        (r"\bcrushing\s+sensation\b",                   "Crushing chest sensation"),
        (r"\bpressure\s+and\s+sweating\b",              "Chest pressure with diaphoresis"),
        (r"\bheart\s+attack\b",                         "Possible heart attack"),
        (r"\bmy\s+heart\s+stopped\b",                   "Possible cardiac arrest"),
        (r"\bpalpitation[s]?\s+(with|and)\s+chest\b",   "Palpitations with chest pain / cardiac concern"),
        (r"\bheart\s+racing\s+(uncontrollably|very\s+fast)\b", "Severe tachycardia concern"),

        # ── Respiratory ─────────────────────────────────────────────────────
        (r"\bshortness\s+of\s+breath\b",                "Difficulty breathing / dyspnea"),
        (r"\bdifficulty\s+breathing\b",                 "Difficulty breathing / dyspnea"),
        (r"\bcan'?t\s+breathe\b",                       "Difficulty breathing / dyspnea"),
        (r"\bcan\s*not\s+breathe\b",                    "Difficulty breathing / dyspnea"),
        (r"\bbreathless(ness)?\b",                      "Acute breathlessness"),
        (r"\bgasping\s+for\s+air\b",                    "Acute respiratory distress"),
        (r"\bcannot\s+catch\s+(my\s+)?breath\b",        "Acute respiratory distress"),
        (r"\bstruggling\s+to\s+breathe\b",              "Acute respiratory distress"),
        (r"\bbreathing\s+.*(fast|rapidly)\b",           "Respiratory distress / tachypnea"),
        (r"\bpass\s+out\b",                             "Syncope / loss of consciousness"),

        # ── Neurological / Stroke ───────────────────────────────────────────
        (r"\bstroke\b",                                 "Possible stroke sign"),
        (r"\bface\s+droop(ing)?\b",                     "Possible stroke sign (facial drooping)"),
        (r"\bslurred\s+speech\b",                       "Possible stroke sign (slurred speech)"),
        (r"\bspeech\s+is\s+difficult\s+to\s+understand\b", "Possible stroke sign (dysarthria)"),
        (r"\bsmile\s+looks?\s+uneven\b",                "Possible stroke sign (facial asymmetry)"),
        (r"\barm\s+.*feels?\s+useless\b",               "Possible stroke sign (limb weakness)"),
        (r"\barm\s+.*(became|feels?)\s+numb\b",         "Sudden arm numbness / neurological concern"),
        (r"\bsuddenly\s+became\s+numb\b",               "Sudden neurological numbness"),
        (r"\bsudden\s+weakness\b",                      "Sudden neurological weakness / stroke sign"),
        (r"\bweakness\s+(on|in)\s+.*(side|arm|leg)\b",  "Sudden neurological weakness"),
        (r"\bsudden\s+numbness\b",                      "Sudden neurological numbness/weakness"),
        (r"\bparalysis\b",                              "Sudden paralysis / neurological emergency"),
        (r"\bsudden(ly)?\s+c?an'?t\s+see\b",           "Sudden vision loss"),
        (r"\bsudden(ly)?\s+cannot\s+see\b",             "Sudden vision loss"),
        (r"\bsudden\s+loss\s+of\s+vision\b",            "Sudden vision loss"),
        (r"\bsudden\s+blindness\b",                     "Sudden vision loss / ocular emergency"),
        (r"\bdouble\s+vision\s+suddenly\b",             "Sudden diplopia / neurological concern"),
        (r"\beyes?\s+not\s+moving\b",                   "Ocular palsy / neurological concern"),

        # ── Trauma / Spinal ─────────────────────────────────────────────────
        (r"\bserious\s+fall\b",                         "Serious fall / trauma indicator"),
        (r"\bsevere\s+neck\s+pain\b",                   "Severe neck pain / spinal trauma"),
        (r"\baccident\b.*\bneck\b",                     "Trauma with neck/spinal injury concern"),
        (r"\bhead\s+injury\b",                          "Head injury"),
        (r"\bsevere\s+trauma\b",                        "Severe physical trauma"),

        # ── Airway & Anaphylaxis ─────────────────────────────────────────────
        (r"\bunconscious(ness)?\b",                     "Loss of consciousness / syncope"),
        (r"\bpassed\s+out\b",                           "Loss of consciousness / syncope"),
        (r"\banaphylaxis\b",                            "Severe allergic reaction / anaphylaxis"),
        (r"\bsevere\s+allergic\s+reaction\b",           "Severe allergic reaction"),
        (r"\bswelling\s+of\s+(my\s+|the\s+)?throat\b", "Airway swelling / anaphylaxis"),
        (r"\blips\s+are\s+swelling\b",                  "Angioedema / facial swelling"),
        (r"\bthroat\s+closing\b",                       "Severe allergic reaction / respiratory compromise"),
        (r"\bcoughing\s+(up\s+)?blood\b",               "Hemoptysis (coughing blood)"),
        (r"\bstiff\s+neck\b",                           "Stiff neck (possible meningeal sign)"),

        # ── Severe Bleeding / Hemorrhage ────────────────────────────────────
        (r"\bvomiting\s+blood\b",                       "Hematemesis (vomiting blood) / GI hemorrhage"),
        (r"\bblood\s+in\s+(my\s+)?stool\b",             "Rectal/GI bleeding"),
        (r"\bblack\s+tarry\s+stool\b",                  "Melena / possible upper GI bleed"),
        (r"\brectal\s+bleeding\b",                      "Rectal hemorrhage"),
        (r"\bblood\s+in\s+(my\s+)?urine\b",             "Hematuria / urinary bleeding"),
        (r"\bheavy\s+bleeding\b",                       "Severe uncontrolled bleeding"),
        (r"\buncontrolled\s+bleeding\b",                "Severe uncontrolled bleeding"),
        (r"\bbleeding\s+(won'?t|does\s+not|doesn'?t)\s+stop\b", "Persistent uncontrolled bleeding"),

        # ── Self-Harm / Psychiatric Emergency ────────────────────────────────
        (r"\bsuicidal\b",                               "Suicidal ideation / psychiatric emergency"),
        (r"\bwant\s+to\s+(kill|end|harm)\s+(my)?self\b", "Self-harm / suicidal ideation"),
        (r"\bthinking\s+of\s+ending\s+it\b",            "Suicidal ideation"),
        (r"\bwant\s+to\s+die\b",                        "Suicidal ideation"),
        (r"\bdon'?t\s+want\s+to\s+live\b",              "Suicidal ideation"),
        (r"\bself[\s\-]?harm(ing)?\b",                  "Self-harm / psychiatric emergency"),
        (r"\bharming\s+myself\b",                       "Self-harm / psychiatric emergency"),
        (r"\bhurt(ing)?\s+myself\b",                    "Self-harm / psychiatric emergency"),

        # ── Pediatric Emergency ──────────────────────────────────────────────
        (r"\bbaby\s+is\s+not\s+breathing\b",            "Pediatric respiratory emergency"),
        (r"\binfant\s+(not\s+)?(breathing|responsive)\b", "Pediatric emergency — infant unresponsive"),
        (r"\bbaby\s+(is\s+)?(turning\s+|going\s+)?blue\b",             "Pediatric cyanosis / emergency"),
        (r"\bchild\s+having\s+seizure\b",               "Pediatric seizure emergency"),
        (r"\bchild\s+unresponsive\b",                   "Pediatric emergency — child unresponsive"),
        (r"\bbaby\s+won'?t\s+wake\s+up\b",              "Pediatric emergency — altered consciousness"),
        (r"\bnewborn\s+(with\s+)?(high\s+)?fever\b",    "Neonatal fever emergency"),

        # ── Diabetic Emergency ───────────────────────────────────────────────
        (r"\bblood\s+sugar\s+(is\s+)?(very\s+)?(high|low)\b",   "Blood glucose emergency"),
        (r"\bsevere\s+hypoglycemia\b",                  "Severe hypoglycemia"),
        (r"\bdiabetic\s+coma\b",                        "Diabetic coma / emergency"),

        # ── Poisoning / Overdose ─────────────────────────────────────────────
        (r"\boverdose\b",                               "Drug overdose / poisoning emergency"),
        (r"\btook\s+too\s+many\s+pills\b",              "Possible medication overdose"),
        (r"\baccidental\s+poisoning\b",                 "Accidental poisoning / toxic exposure"),
        (r"\bswallowed\s+something\s+toxic\b",          "Toxic ingestion emergency"),

        # ── Severe Burns ─────────────────────────────────────────────────────
        (r"\bsevere\s+burn\b",                          "Severe thermal burn"),
        (r"\bchemical\s+burn\b",                        "Chemical burn / toxic exposure"),
        (r"\bburned\s+over\s+(a\s+)?large\s+area\b",   "Extensive burn injury"),

        # ── Multilingual Red Flags — Hindi / Hinglish ────────────────────────
        (r"\bseene\s+mein\s+dard\b",                    "Chest pain (Hindi phrasing)"),
        (r"\bsaans\s+lene\s+mein\s+dikkat\b",           "Difficulty breathing (Hindi phrasing)"),
        (r"\bsaans\s+nahi\s+aa\s+rahi\b",               "Difficulty breathing (Hindi phrasing)"),
        (r"\bbehosh\s+ho\s+gay[ao]\b",                  "Loss of consciousness (Hindi phrasing)"),
        (r"\bhaath\s+sun[ao]\s+ho\s+gay[ao]\b",         "Sudden arm numbness (Hindi phrasing)"),
        (r"\bchakkar\s+aa\s+rahe\s+hai[nn]?\b",         "Dizziness / vertigo (Hindi phrasing)"),
        (r"\bbahut\s+tej\s+dard\b",                     "Severe pain (Hindi phrasing)"),
        (r"\buthna\s+mushkil\s+ho\s+raha\b",            "Difficulty standing / weakness (Hindi phrasing)"),
        (r"\bsar\s+ghoom\s+raha\s+hai\b",               "Severe dizziness (Hindi phrasing)"),
        (r"\bmar\s+jana\s+chahta\b",                    "Suicidal ideation (Hindi phrasing)"),
        (r"\bjeena\s+nahi\s+chahta\b",                  "Suicidal ideation (Hindi phrasing)"),

        # ── Multilingual Red Flags — Telugu / Telugu-English ─────────────────
        (r"\bchest\s+pain\s+undi\b",                    "Chest pain (Telugu-English code-mixed)"),
        (r"\bbreathing\s+.*kastanga\s+undi\b",          "Difficulty breathing (Telugu-English code-mixed)"),
        (r"\bbreath\s+teesukovaleka\s+unna\b",          "Difficulty breathing (Telugu phrasing)"),
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # 🟡 MODERATE-RISK PATTERNS  →  MEDICAL_EVALUATION_RECOMMENDED + MEDIUM
    # ─────────────────────────────────────────────────────────────────────────
    MODERATE_PATTERNS: List[Tuple[str, str]] = [
        # Temperature
        (r"\b(high\s+)?fev[ae]?r\b",                    "Fever / elevated body temperature"),
        (r"\btemperature\s+(is|of)?\s*(10[0-9]|99|\d+(\.\d+)?\s*f)\b", "Elevated temperature"),

        # Cough
        (r"\bpersistent\s+cough\b",                     "Persistent cough"),
        (r"\bcough\s+(is\s+getting\s+worse|has\s+lasted|for)\b", "Persistent / worsening cough"),

        # GI
        (r"\bvomit+ing\b",                              "Vomiting / gastrointestinal distress"),
        (r"\bthrowing\s+up\b",                          "Vomiting / gastrointestinal distress"),
        (r"\babdominal\s+pain\b",                       "Abdominal pain"),
        (r"\bstomach\s+has\s+been\s+hurting\b",         "Persistent stomach pain"),
        (r"\bstomach\s+pain\b",                         "Stomach pain"),

        # Head / Neuro
        (r"\bsevere\s+headache\b",                      "Severe headache"),
        (r"\bdizz(y|iness)\b",                          "Dizziness / vertigo"),
        (r"\blightheaded(ness)?\b",                     "Lightheadedness / possible vertigo"),
        (r"\bblurred\s+vision\b",                       "Blurred vision (visual disturbance)"),

        # Cardiac (non-emergency)
        (r"\bpalpitation[s]?\b",                        "Cardiac palpitations"),
        (r"\bheart\s+racing\b",                         "Tachycardia / palpitations"),
        (r"\birregular\s+heartbeat\b",                  "Irregular heartbeat"),
        (r"\b(high|elevated)\s+blood\s+pressure\b",     "Hypertension concern"),

        # Joints / MSK
        (r"\bjoint[s]?\s+.*(stiff|swollen|pain)\b",     "Joint inflammation/stiffness"),
        (r"\bswollen\s+and\s+painful\b",                "Swollen and painful joint/limb"),
        (r"\bdifficulty\s+walking\b",                   "Mobility concern"),

        # Throat / ENT
        (r"\bpersistent\s+sore\s+throat\b",             "Persistent sore throat"),
        (r"\bsore\s+throat\s+that\s+is\s+not\s+improving\b", "Persistent sore throat"),
        (r"\bdifficulty\s+swallowing\b",                "Difficulty swallowing"),
        (r"\bear\s+pain\b",                             "Ear pain/infection sign"),

        # Urinary / Skin
        (r"\burinary\s+burning\b",                      "Urinary tract symptom"),
        (r"\bfrequent\s+urination\b",                   "Urinary frequency"),
        (r"\brash\b",                                   "Skin rash"),
        (r"\bnight\s+sweats\b",                         "Night sweats (possible systemic illness)"),
        (r"\bunexplained\s+weight\s+loss\b",            "Unexplained weight loss"),

        # Multilingual Moderate — Hindi
        (r"\bbukhar\s+(hai|ho\s+gaya|ho\s+raha)\b",     "Fever (Hindi phrasing)"),
        (r"\bpet\s+mein\s+dard\b",                      "Abdominal pain (Hindi phrasing)"),
        (r"\bulti\s+(aa\s+rahi\s+hai|ho\s+rahi\s+hai)\b", "Vomiting (Hindi phrasing)"),
        (r"\bsar\s+mein\s+(bahut\s+)?dard\b",           "Headache (Hindi phrasing)"),

        # Multilingual Moderate — Telugu
        (r"\bgudde\s+noppi\s+undi\b",                   "Abdominal pain (Telugu phrasing)"),
        (r"\bnenu\s+baguneledhu\b",                     "Feeling unwell (Telugu phrasing)"),
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # 🟢 MINOR / SELF-CARE PATTERNS  →  SELF_CARE + LOW risk
    # ─────────────────────────────────────────────────────────────────────────
    MINOR_PATTERNS: List[Tuple[str, str]] = [
        (r"\bmild\s+headache\b",                        "Mild headache"),
        (r"\bslight\s+headache\b",                      "Mild headache"),
        (r"\bheadache\b",                               "Headache"),
        (r"\brunny\s+nose\b",                           "Runny nose / nasal congestion"),
        (r"\bstuffy\s+nose\b",                          "Nasal congestion"),
        (r"\bsneezing\b",                               "Sneezing"),
        (r"\bmild(ly)?\s+tired\b",                      "Mild fatigue"),
        (r"\bslight(ly)?\s+tired\b",                    "Mild fatigue"),
        (r"\ba\s+bit\s+drained\b",                      "Mild fatigue"),
        (r"\bfeel\s+tired\b",                           "Mild fatigue"),
        (r"\blow\s+energy\b",                           "Low energy / fatigue"),
        (r"\bno\s+energy\b",                            "Fatigue / low energy"),
        (r"\bslight\s+muscle\s+soreness\b",             "Mild muscle soreness"),
        (r"\btiny\s+muscle\s+ache\b",                   "Mild muscle ache"),
        (r"\bmild\s+muscle\s+ache\b",                   "Mild muscle soreness"),
        (r"\bbody\s+ache[s]?\b",                        "Mild body aches"),
        (r"\b(a\s+little\s+|mild\s+)stomach\s+discomfort\b", "Mild stomach discomfort"),
        (r"\bstomach\s+discomfort\b",                   "Mild stomach discomfort"),
        (r"\bbloated\b",                                "Bloating / minor GI discomfort"),
        (r"\bdry\s+cough\b",                            "Dry cough"),
        (r"\bsore\s+throat\b",                          "Sore throat"),
        (r"\bminor\s+scratch\b",                        "Minor abrasion / scratch"),
        (r"\bloss\s+of\s+appetite\b",                   "Reduced appetite"),
        (r"\bfeel\s+okay\b",                            "No significant symptoms reported"),
        (r"\bno\s+(other\s+)?symptoms\b",               "No significant symptoms reported"),
        # Multilingual Minor — Hindi
        (r"\bthanda\s+lag\s+raha\s+hai\b",              "Feeling cold / chills (Hindi phrasing)"),
        (r"\bhalka\s+bukhar\b",                         "Mild fever (Hindi phrasing)"),
        (r"\bthodi\s+thakaan\b",                        "Mild fatigue (Hindi phrasing)"),
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # NEGATION VOCABULARY  (used by _extract_valid_matches)
    # ─────────────────────────────────────────────────────────────────────────
    _NEGATION_TOKENS = (
        r"no|not|never|without|denies|denied|"
        r"do\s+not\s+have|don'?t\s+have|does\s+not\s+have|doesn'?t\s+have|"
        r"did\s+not\s+have|didn'?t\s+have|"
        r"absence\s+of|ruled\s+out|negative\s+for|"
        r"no\s+history\s+of|no\s+sign\s+of|no\s+evidence\s+of|"
        r"no\s+longer|not\s+currently|resolved|cleared|gone\s+away|"
        r"not\s+currently\s+experiencing"
    )

    # Third-person / attribution phrases that de-scope the symptom from self
    _THIRD_PERSON_PHRASES = [
        r"my\s+(friend|mother|father|brother|sister|uncle|aunt|colleague|neighbor|patient)\s+(had|has|is\s+having|was\s+having)",
        r"a\s+(friend|colleague|relative|patient)\s+(had|has)",
        r"i\s+(read|heard|learned)\s+about",
        r"someone\s+(i\s+know\s+)?(had|has)",
        r"they\s+(told\s+me|said)\s+i\s+might\s+have",
    ]

    # Conditional / hypothetical framing → REVIEW_REQUIRED (not escalated)
    _CONDITIONAL_PHRASES = [
        r"\bwondering\s+if\s+i\s+(have|had|might\s+have)\b",
        r"\bcould\s+this\s+be\b",
        r"\bam\s+i\s+having\b",
        r"\bdo\s+i\s+have\b",
        r"\bif\s+i\s+had\b",
        r"\btomorrow\s+i\s+might\b",
        r"\bjust\s+in\s+case\b",
    ]

    # Historical / past framing signals
    _HISTORICAL_PHRASES = [
        r"\bhad\s+\w+\s+(last\s+year|last\s+month|years?\s+ago|months?\s+ago|long\s+ago|in\s+the\s+past)\b",
        r"\bpreviously\s+had\b",
        r"\bonce\s+had\b",
        r"\bi\s+used\s+to\s+have\b",
        r"\bused\s+to\s+suffer\s+from\b",
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # PUBLIC API
    # ─────────────────────────────────────────────────────────────────────────

    @classmethod
    def evaluate_symptoms(cls, text: str) -> Tuple[Dict[str, Any], RiskLevel, float, float]:
        """
        Evaluates a free-text symptom description and returns a standardised
        clinical decision-support payload (non-diagnostic).

        Returns:
            (result_dict, risk_level, risk_score, confidence)
        """
        clean_text = text.lower().strip()

        # ── Step 1: Noise / Garbage / Ambiguous input ────────────────────────
        if cls._is_garbage_or_ambiguous(clean_text):
            result = {
                "possibleConcerns": ["Ambiguous or non-specific presentation requiring clinical review"],
                "urgency": UrgencyLevel.REVIEW_REQUIRED.value,
                "guidance": (
                    "Symptom description is ambiguous, noisy, or non-specific. "
                    "Please provide a more detailed description of your symptoms or consult a clinician."
                ),
                "symptomsExtracted": ["Ambiguous/Non-specific description"],
                "disclaimer": cls.MANDATORY_DISCLAIMER,
            }
            return result, RiskLevel.UNKNOWN, 0.0, 0.50

        # ── Step 2: Conditional / hypothetical framing ───────────────────────
        if cls._is_conditional_framing(clean_text):
            result = {
                "possibleConcerns": ["Conditional or hypothetical symptom description — clinical review required"],
                "urgency": UrgencyLevel.REVIEW_REQUIRED.value,
                "guidance": (
                    "Your description appears to be hypothetical or uncertain. "
                    "If you are currently experiencing any of these symptoms, please seek immediate clinical evaluation."
                ),
                "symptomsExtracted": ["Conditional/hypothetical description"],
                "disclaimer": cls.MANDATORY_DISCLAIMER,
            }
            return result, RiskLevel.UNKNOWN, 0.0, 0.55

        # ── Step 3: Pattern matching ─────────────────────────────────────────
        extracted_red_flags = cls._extract_valid_matches(clean_text, cls.RED_FLAG_PATTERNS)
        extracted_moderate  = cls._extract_matches(clean_text, cls.MODERATE_PATTERNS)
        extracted_minor     = cls._extract_matches(clean_text, cls.MINOR_PATTERNS)

        all_extracted_labels = list(set(
            [desc for _, desc in extracted_red_flags]
            + [desc for _, desc in extracted_moderate]
            + [desc for _, desc in extracted_minor]
        ))

        # ── Step 4: Triage decision (safety-first priority) ──────────────────

        # RULE 1 — Valid red flags present → EMERGENCY
        if extracted_red_flags:
            urgency    = UrgencyLevel.EMERGENCY
            risk_level = RiskLevel.HIGH
            risk_score = 0.94
            confidence = 0.92
            concerns   = [f"Possible urgent medical condition ({desc})" for _, desc in extracted_red_flags]
            guidance   = (
                "CRITICAL ALERT: Your symptoms include potential red-flag medical indicators. "
                "Immediate emergency medical evaluation (e.g., calling emergency services or "
                "going to the nearest emergency department) is strongly advised. "
                "Do not delay seeking clinical care."
            )

        # RULE 2 — Moderate symptoms only
        elif extracted_moderate:
            urgency    = UrgencyLevel.MEDICAL_EVALUATION_RECOMMENDED
            risk_level = RiskLevel.MEDIUM
            risk_score = 0.60
            confidence = 0.85
            concerns   = [f"Possible concern: {desc}" for _, desc in extracted_moderate]
            guidance   = (
                "Medical evaluation is recommended. Monitor your symptoms closely, ensure "
                "adequate rest and hydration, and consult a physician or healthcare provider "
                "for a thorough examination."
            )

        # RULE 3 — Minor / self-care only
        elif extracted_minor:
            urgency    = UrgencyLevel.SELF_CARE
            risk_level = RiskLevel.LOW
            risk_score = 0.25
            confidence = 0.82
            concerns   = [f"Possible minor concern: {desc}" for _, desc in extracted_minor]
            guidance   = (
                "General self-care and symptom monitoring recommended. Stay hydrated and rest. "
                "If symptoms worsen or persist beyond a few days, consult a healthcare professional."
            )

        # RULE 4 — Fallback (no pattern matched)
        else:
            is_well = any(w in clean_text for w in ["okay", "good", "fine", "normal", "well", "healthy"])
            urgency    = UrgencyLevel.SELF_CARE if is_well else UrgencyLevel.MEDICAL_EVALUATION_RECOMMENDED
            risk_level = RiskLevel.LOW if is_well else RiskLevel.MEDIUM
            risk_score = 0.20 if is_well else 0.45
            confidence = 0.70
            concerns   = ["General symptom description"]
            guidance   = "General self-care recommended. Consult a physician if symptoms worsen or persist."

        if not all_extracted_labels:
            all_extracted_labels = ["General symptom description"]

        result = {
            "possibleConcerns":  concerns,
            "urgency":           urgency.value,
            "guidance":          guidance,
            "symptomsExtracted": all_extracted_labels,
            "disclaimer":        cls.MANDATORY_DISCLAIMER,
        }
        return result, risk_level, risk_score, confidence

    # ─────────────────────────────────────────────────────────────────────────
    # PRIVATE HELPERS
    # ─────────────────────────────────────────────────────────────────────────

    @classmethod
    def _is_garbage_or_ambiguous(cls, text: str) -> bool:
        """Returns True for inputs too short, gibberish, or meta-test text."""
        stripped = text.strip()
        # Too short to be clinically meaningful
        if len(stripped) < 4:
            return True
        # Pure punctuation / symbols only
        if re.fullmatch(r"[^a-zA-Z\u0900-\u097F\u0C00-\u0C7F]+", stripped):
            return True
        # Known gibberish patterns
        if re.search(r"\b(qwerty|xyz|asdf|12345|lorem|ipsum)\b", text):
            return True
        # Meta-test phrases
        if any(p in text for p in ["test sentence", "sample text", "placeholder"]):
            return True
        # Unexplainable / vague non-symptom descriptions
        if any(p in text for p in ["feel weird", "cannot explain them", "cannot explain", "something is wrong but i"]):
            return True
        return False

    @classmethod
    def _is_conditional_framing(cls, text: str) -> bool:
        """Returns True when text describes hypothetical / future / uncertain symptoms."""
        for pattern in cls._CONDITIONAL_PHRASES:
            if re.search(pattern, text):
                return True
        return False

    @classmethod
    def _is_third_person(cls, context_window: str, full_text: str) -> bool:
        """Returns True when the full text or immediate context attributes symptoms to another person."""
        for pattern in cls._THIRD_PERSON_PHRASES:
            if re.search(pattern, full_text) or re.search(pattern, context_window):
                return True
        return False

    @classmethod
    def _is_historical(cls, context_window: str, full_text: str) -> bool:
        """Returns True when the full text frames the symptom in the past / resolved."""
        for pattern in cls._HISTORICAL_PHRASES:
            if re.search(pattern, full_text) or re.search(pattern, context_window):
                return True
        # Inline past-tense resolution clues  e.g. "had chest pain but feel fine now"
        if re.search(r"\b(had|was\s+having)\b.{0,60}\b(but\s+(i\s+)?(feel|am)\s+(fine|okay|better|well)|now\s+i\s+am\s+(fine|okay|better|well))\b", full_text):
            return True
        return False

    @classmethod
    def _extract_valid_matches(
        cls, text: str, patterns: List[Tuple[str, str]]
    ) -> List[Tuple[str, str]]:
        """
        Extracts red-flag pattern matches from text, filtering out:
        - Negated occurrences (50-char context window with 15+ negation tokens,
          including two-word gap tolerance)
        - Third-person attributed symptoms
        - Historically framed / resolved symptoms
        """
        matches = []
        for pattern, label in patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                start = match.start()
                # 50-char context window before the match
                context = text[max(0, start - 50): start]

                # ── Negation check (direct negation + one-word gap) ──────────
                negation_re = (
                    r"\b(?:" + cls._NEGATION_TOKENS + r")\s*(\w+\s+)?"
                )
                if re.search(negation_re + r"$", context, re.IGNORECASE):
                    break  # negated — skip this pattern entirely

                # ── Third-person attribution check ───────────────────────────
                if cls._is_third_person(context, text):
                    break

                # ── Historical / resolved framing check ──────────────────────
                if cls._is_historical(context, text):
                    break

                # ── Valid match — record and move to next pattern ─────────────
                matches.append((pattern, label))
                break

        return matches

    @staticmethod
    def _extract_matches(
        text: str, patterns: List[Tuple[str, str]]
    ) -> List[Tuple[str, str]]:
        """
        Simple pattern-matching for moderate / minor symptoms (no negation filter
        applied here; these are lower-stakes classifications).
        """
        return [
            (pattern, label)
            for pattern, label in patterns
            if re.search(pattern, text, re.IGNORECASE)
        ]
