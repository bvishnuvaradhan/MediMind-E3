"""
test_robustness.py — Phase 2 Robustness Test Suite
====================================================
Covers 14 real-world edge-case categories for the GeneralHealthNLPEngine:

  1.  Negation detection
  2.  Third-person attribution
  3.  Conditional / hypothetical framing
  4.  Idiom handling
  5.  Multilingual — Hindi / Hinglish
  6.  Multilingual — Telugu-English code-mix
  7.  Pediatric emergencies
  8.  Self-harm / psychiatric emergencies
  9.  Severe bleeding / hemorrhage
  10. Diabetic emergencies
  11. Poisoning / overdose emergencies
  12. Historical / past-framing de-escalation
  13. Temporal & compound severity
  14. Garbage / ambiguous / edge-case inputs

All emergency red-flag cases MUST produce EMERGENCY + HIGH risk.
All disclaimer fields MUST equal GeneralHealthNLPEngine.MANDATORY_DISCLAIMER.
"""

import pytest
from app.models.general_health.general_health_nlp import GeneralHealthNLPEngine
from app.schemas.prediction_schemas import UrgencyLevel, RiskLevel

DISCLAIMER = GeneralHealthNLPEngine.MANDATORY_DISCLAIMER
EMERGENCY   = UrgencyLevel.EMERGENCY.value
MED_EVAL    = UrgencyLevel.MEDICAL_EVALUATION_RECOMMENDED.value
SELF_CARE   = UrgencyLevel.SELF_CARE.value
REVIEW      = UrgencyLevel.REVIEW_REQUIRED.value
HIGH   = RiskLevel.HIGH
MEDIUM = RiskLevel.MEDIUM
LOW    = RiskLevel.LOW
UNKNOWN = RiskLevel.UNKNOWN


# ─────────────────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────────────────

def evaluate(text: str):
    return GeneralHealthNLPEngine.evaluate_symptoms(text)


def assert_emergency(text: str, label_hint: str = ""):
    result, risk, score, conf = evaluate(text)
    assert result["urgency"] == EMERGENCY, (
        f"Expected EMERGENCY for: '{text}'{(' [' + label_hint + ']') if label_hint else ''}"
        f"\n  Got: urgency={result['urgency']}, risk={risk}"
    )
    assert risk == HIGH, f"Expected HIGH risk for: '{text}'"
    assert score >= 0.90
    assert result["disclaimer"] == DISCLAIMER


def assert_not_emergency(text: str, label_hint: str = ""):
    result, risk, score, conf = evaluate(text)
    assert result["urgency"] != EMERGENCY, (
        f"Expected NOT EMERGENCY for negated/third-person input: '{text}'{(' [' + label_hint + ']') if label_hint else ''}"
        f"\n  Got: urgency={result['urgency']}"
    )
    assert result["disclaimer"] == DISCLAIMER


# ─────────────────────────────────────────────────────────────────────────────
# 1. NEGATION DETECTION
# ─────────────────────────────────────────────────────────────────────────────

class TestNegationDetection:
    """Direct negation should prevent false emergency triggers."""

    def test_no_chest_pain(self):
        assert_not_emergency("I don't have chest pain.", "direct negation with contraction")

    def test_no_shortness_of_breath(self):
        assert_not_emergency("No shortness of breath at all.", "direct 'no' negation")

    def test_not_unconscious(self):
        assert_not_emergency("I was not unconscious at any point.", "past negation")

    def test_denies_stroke(self):
        assert_not_emergency("Patient denies stroke symptoms.", "clinical denial")

    def test_no_history_of_chest_pain(self):
        assert_not_emergency("No history of chest pain or cardiac events.", "no history of")

    def test_negative_for_shortness_of_breath(self):
        assert_not_emergency("Negative for shortness of breath on admission.", "negative for")

    def test_no_sign_of_paralysis(self):
        assert_not_emergency("No sign of paralysis or limb weakness found.", "no sign of")

    def test_never_had_chest_pain(self):
        assert_not_emergency("I have never had chest pain in my life.", "never")

    def test_does_not_have_chest_tightness(self):
        assert_not_emergency("She does not have chest tightness.", "does not have")

    def test_absence_of_unconsciousness(self):
        assert_not_emergency("Absence of unconsciousness noted.", "absence of")

    def test_no_longer_breathless(self):
        assert_not_emergency("Patient is no longer breathless after treatment.", "no longer")

    def test_negation_with_one_word_gap(self):
        assert_not_emergency("No significant chest pain was observed.", "one-word gap negation")

    def test_without_chest_pain(self):
        assert_not_emergency("Patient presented without chest pain.", "without")

    # Positive control — real emergency should still fire
    def test_real_chest_pain_fires(self):
        assert_emergency("I am having severe chest pain right now.", "positive control")


# ─────────────────────────────────────────────────────────────────────────────
# 2. THIRD-PERSON ATTRIBUTION
# ─────────────────────────────────────────────────────────────────────────────

class TestThirdPersonAttribution:
    """Symptoms attributed to another person should not trigger self-emergency."""

    def test_friend_had_chest_pain(self):
        assert_not_emergency("My friend had chest pain last week.", "friend attribution")

    def test_mother_had_stroke(self):
        assert_not_emergency("My mother had a stroke two years ago.", "mother attribution")

    def test_colleague_had_shortness_of_breath(self):
        assert_not_emergency("A colleague had shortness of breath yesterday.", "colleague attribution")

    def test_patient_had_unconsciousness(self):
        assert_not_emergency("My patient had unconsciousness on arrival.", "patient attribution")

    # Positive control — self-reported should still fire
    def test_self_reported_chest_pain(self):
        assert_emergency("I am having chest pain right now.", "positive self-report control")


# ─────────────────────────────────────────────────────────────────────────────
# 3. CONDITIONAL / HYPOTHETICAL FRAMING
# ─────────────────────────────────────────────────────────────────────────────

class TestConditionalFraming:
    """Conditional / hypothetical descriptions → REVIEW_REQUIRED, not EMERGENCY."""

    def test_wondering_if_heart_attack(self):
        result, risk, _, _ = evaluate("I am wondering if I have a heart attack.")
        assert result["urgency"] == REVIEW, "Conditional framing should be REVIEW_REQUIRED"
        assert result["disclaimer"] == DISCLAIMER

    def test_could_this_be_a_stroke(self):
        result, risk, _, _ = evaluate("Could this be a stroke?")
        assert result["urgency"] == REVIEW, "Interrogative framing should be REVIEW_REQUIRED"

    def test_if_i_had_chest_pain(self):
        result, risk, _, _ = evaluate("If I had chest pain, what would I do?")
        assert result["urgency"] == REVIEW

    def test_just_in_case(self):
        result, risk, _, _ = evaluate("Just in case I have chest tightness, what should I do?")
        assert result["urgency"] == REVIEW


# ─────────────────────────────────────────────────────────────────────────────
# 4. IDIOM HANDLING
# ─────────────────────────────────────────────────────────────────────────────

class TestIdiomHandling:
    """English idioms describing cardiac/respiratory distress → EMERGENCY."""

    def test_elephant_on_chest(self):
        assert_emergency("There is an elephant on my chest.", "classic cardiac pressure idiom")

    def test_weight_on_chest(self):
        assert_emergency("I feel a heavy weight on my chest.", "weight on chest idiom")

    def test_crushing_sensation(self):
        assert_emergency("I feel a crushing sensation in my chest.", "crushing sensation")

    def test_cant_catch_breath(self):
        assert_emergency("I cannot catch my breath.", "breath catching idiom")

    def test_gasping_for_air(self):
        assert_emergency("I am gasping for air.", "gasping idiom")


# ─────────────────────────────────────────────────────────────────────────────
# 5. MULTILINGUAL — HINDI / HINGLISH
# ─────────────────────────────────────────────────────────────────────────────

class TestMultilingualHindi:
    """Hindi and Hinglish symptom phrases must be correctly triaged."""

    # Red flags
    def test_seene_mein_dard(self):
        assert_emergency("Mujhe seene mein dard ho raha hai.", "Hindi chest pain")

    def test_saans_lene_mein_dikkat(self):
        assert_emergency("Mujhe saans lene mein dikkat ho rahi hai.", "Hindi breathing difficulty")

    def test_saans_nahi_aa_rahi(self):
        assert_emergency("Saans nahi aa rahi hai abhi.", "Hindi no breath")

    def test_behosh_ho_gaya(self):
        assert_emergency("Woh behosh ho gaya suddenly.", "Hindi unconscious")

    def test_haath_suna_ho_gaya(self):
        assert_emergency("Mera haath suna ho gaya hai achanak.", "Hindi arm numbness")

    def test_bahut_tej_dard(self):
        assert_emergency("Mujhe bahut tej dard ho raha hai seene mein.", "Hindi severe pain")

    def test_mar_jana_chahta(self):
        assert_emergency("Main mar jana chahta hoon.", "Hindi suicidal ideation")

    # Moderate
    def test_bukhar_hai(self):
        result, risk, _, _ = evaluate("Mujhe bukhar hai aaj se.")
        assert result["urgency"] == MED_EVAL, "Hindi fever should be MEDIUM"
        assert result["disclaimer"] == DISCLAIMER

    def test_ulti_aa_rahi_hai(self):
        result, risk, _, _ = evaluate("Ulti aa rahi hai baar baar.")
        assert result["urgency"] == MED_EVAL, "Hindi vomiting should be MEDIUM"

    def test_pet_mein_dard(self):
        result, risk, _, _ = evaluate("Mujhe pet mein dard hai.")
        assert result["urgency"] == MED_EVAL, "Hindi abdominal pain should be MEDIUM"

    # Minor
    def test_thanda_lag_raha_hai(self):
        result, risk, _, _ = evaluate("Mujhe thanda lag raha hai.")
        assert result["urgency"] == SELF_CARE, "Hindi mild chills should be SELF_CARE"
        assert risk == LOW


# ─────────────────────────────────────────────────────────────────────────────
# 6. MULTILINGUAL — TELUGU-ENGLISH CODE-MIX
# ─────────────────────────────────────────────────────────────────────────────

class TestMultilingualTelugu:
    """Telugu-English code-mixed symptom phrases must be correctly triaged."""

    def test_chest_pain_undi(self):
        assert_emergency("Naku chest pain undi.", "Telugu-English chest pain")

    def test_breath_teesukovaleka_unna(self):
        assert_emergency("Nenu breath teesukovaleka unna.", "Telugu breathing difficulty")

    def test_breathing_kastanga_undi(self):
        assert_emergency("Naku breathing kastanga undi.", "Telugu breathing hard")

    def test_gudde_noppi_undi(self):
        result, risk, _, _ = evaluate("Naku gudde noppi undi.")
        assert result["urgency"] == MED_EVAL, "Telugu abdominal pain should be MEDIUM"
        assert result["disclaimer"] == DISCLAIMER


# ─────────────────────────────────────────────────────────────────────────────
# 7. PEDIATRIC EMERGENCIES
# ─────────────────────────────────────────────────────────────────────────────

class TestPediatricEmergencies:
    """Infant and child emergency descriptions must always escalate to EMERGENCY."""

    def test_baby_not_breathing(self):
        assert_emergency("Baby is not breathing!", "infant respiratory arrest")

    def test_infant_not_responsive(self):
        assert_emergency("Infant not responsive and not breathing.", "infant unresponsive")

    def test_baby_turning_blue(self):
        assert_emergency("The baby is turning blue.", "infant cyanosis")

    def test_child_having_seizure(self):
        assert_emergency("My child having seizure right now.", "pediatric seizure")

    def test_child_unresponsive(self):
        assert_emergency("Child unresponsive after fall.", "child altered consciousness")

    def test_baby_wont_wake_up(self):
        assert_emergency("Baby won't wake up since one hour.", "infant unresponsive")

    def test_newborn_fever(self):
        assert_emergency("My newborn fever started this morning.", "neonatal fever")


# ─────────────────────────────────────────────────────────────────────────────
# 8. SELF-HARM / PSYCHIATRIC EMERGENCIES
# ─────────────────────────────────────────────────────────────────────────────

class TestSelfHarmEmergencies:
    """Any indication of suicidal ideation or self-harm must trigger EMERGENCY."""

    def test_suicidal(self):
        assert_emergency("I am feeling suicidal.", "suicidal")

    def test_want_to_kill_myself(self):
        assert_emergency("I want to kill myself.", "explicit suicidal ideation")

    def test_thinking_of_ending_it(self):
        assert_emergency("I have been thinking of ending it.", "passive suicidal ideation")

    def test_want_to_die(self):
        assert_emergency("I want to die.", "death wish")

    def test_dont_want_to_live(self):
        assert_emergency("I don't want to live anymore.", "passive suicidal")

    def test_self_harm(self):
        assert_emergency("I have been self harming.", "self-harm disclosure")

    def test_harming_myself(self):
        assert_emergency("I have been harming myself lately.", "active self-harm")

    def test_hurting_myself(self):
        assert_emergency("I keep hurting myself.", "self-harm")

    def test_hindi_suicidal(self):
        assert_emergency("Main jeena nahi chahta.", "Hindi suicidal ideation")


# ─────────────────────────────────────────────────────────────────────────────
# 9. SEVERE BLEEDING / HEMORRHAGE
# ─────────────────────────────────────────────────────────────────────────────

class TestSevereBleedingEmergencies:
    """Hemorrhagic emergencies must produce EMERGENCY regardless of wording."""

    def test_vomiting_blood(self):
        assert_emergency("I have been vomiting blood since this morning.", "hematemesis")

    def test_blood_in_stool(self):
        assert_emergency("There is blood in my stool.", "GI bleed")

    def test_black_tarry_stool(self):
        assert_emergency("I passed a black tarry stool.", "melena / upper GI bleed")

    def test_rectal_bleeding(self):
        assert_emergency("I have rectal bleeding.", "rectal hemorrhage")

    def test_blood_in_urine(self):
        assert_emergency("I see blood in my urine.", "hematuria")

    def test_heavy_bleeding(self):
        assert_emergency("There is heavy bleeding from my wound.", "severe bleed")

    def test_uncontrolled_bleeding(self):
        assert_emergency("I have uncontrolled bleeding that won't stop.", "uncontrolled bleed")

    def test_coughing_up_blood(self):
        assert_emergency("I am coughing up blood.", "hemoptysis")


# ─────────────────────────────────────────────────────────────────────────────
# 10. DIABETIC EMERGENCIES
# ─────────────────────────────────────────────────────────────────────────────

class TestDiabeticEmergencies:
    def test_blood_sugar_very_high(self):
        assert_emergency("My blood sugar is very high and I feel awful.", "hyperglycemia")

    def test_blood_sugar_very_low(self):
        assert_emergency("Blood sugar very low and I'm shaking.", "hypoglycemia")

    def test_severe_hypoglycemia(self):
        assert_emergency("I am experiencing severe hypoglycemia.", "severe hypoglycemia")

    def test_diabetic_coma(self):
        assert_emergency("I think I am going into a diabetic coma.", "diabetic coma")


# ─────────────────────────────────────────────────────────────────────────────
# 11. POISONING / OVERDOSE
# ─────────────────────────────────────────────────────────────────────────────

class TestPoisoningOverdoseEmergencies:
    def test_overdose(self):
        assert_emergency("I think I took an overdose.", "drug overdose")

    def test_too_many_pills(self):
        assert_emergency("I took too many pills by accident.", "medication overdose")

    def test_accidental_poisoning(self):
        assert_emergency("This looks like accidental poisoning.", "accidental poison")

    def test_swallowed_toxic(self):
        assert_emergency("My child swallowed something toxic.", "toxic ingestion")


# ─────────────────────────────────────────────────────────────────────────────
# 12. HISTORICAL / PAST-FRAMING DE-ESCALATION
# ─────────────────────────────────────────────────────────────────────────────

class TestHistoricalFraming:
    """Past or resolved events should NOT escalate to EMERGENCY."""

    def test_had_chest_pain_last_year_but_fine_now(self):
        assert_not_emergency(
            "I had chest pain last year but I feel fine now.",
            "resolved historical"
        )

    def test_previously_had_stroke(self):
        assert_not_emergency(
            "I previously had a stroke but have recovered fully.",
            "previously had"
        )

    def test_used_to_have_shortness_of_breath(self):
        assert_not_emergency(
            "I used to have shortness of breath years ago.",
            "used to have"
        )


# ─────────────────────────────────────────────────────────────────────────────
# 13. TEMPORAL & COMPOUND SEVERITY
# ─────────────────────────────────────────────────────────────────────────────

class TestTemporalAndCompoundSeverity:
    """Severity language and compound symptoms should be triaged correctly."""

    def test_sudden_chest_pain(self):
        assert_emergency("I have sudden chest pain.", "sudden onset")

    def test_pressure_in_chest(self):
        assert_emergency("There is pressure in my chest.", "pressure idiom")

    def test_mild_headache_and_slight_fatigue(self):
        result, risk, _, _ = evaluate("I have a mild headache and slight fatigue today.")
        assert result["urgency"] == SELF_CARE
        assert risk == LOW
        assert result["disclaimer"] == DISCLAIMER

    def test_fever_and_vomiting_medium(self):
        result, risk, _, _ = evaluate("I have a fever and have been vomiting for 3 days.")
        assert result["urgency"] == MED_EVAL
        assert risk == MEDIUM
        assert result["disclaimer"] == DISCLAIMER

    def test_emergency_with_moderate_mixed(self):
        """When red flags and moderate symptoms coexist, EMERGENCY wins."""
        result, risk, _, _ = evaluate(
            "I have a fever, vomiting, and severe chest pain."
        )
        assert result["urgency"] == EMERGENCY
        assert risk == HIGH

    def test_dizziness_alone_is_moderate(self):
        result, risk, _, _ = evaluate("I feel dizzy and lightheaded.")
        assert result["urgency"] == MED_EVAL
        assert result["disclaimer"] == DISCLAIMER

    def test_palpitations_alone_moderate(self):
        result, risk, _, _ = evaluate("I have been having palpitations since this morning.")
        assert result["urgency"] == MED_EVAL

    def test_dry_cough_alone_self_care(self):
        result, risk, _, _ = evaluate("I have a dry cough and low energy.")
        assert result["urgency"] == SELF_CARE
        assert risk == LOW


# ─────────────────────────────────────────────────────────────────────────────
# 14. GARBAGE / AMBIGUOUS / EDGE-CASE INPUTS
# ─────────────────────────────────────────────────────────────────────────────

class TestGarbageAndEdgeCaseInputs:
    """Noise and ambiguous inputs should produce REVIEW_REQUIRED + UNKNOWN risk."""

    def _assert_review(self, text: str):
        result, risk, _, _ = evaluate(text)
        assert result["urgency"] == REVIEW, f"Expected REVIEW_REQUIRED for: '{text}'"
        assert risk == UNKNOWN
        assert result["disclaimer"] == DISCLAIMER

    def test_gibberish_qwerty(self):
        self._assert_review("qwerty asdf lorem")

    def test_numbers_only(self):
        self._assert_review("12345")

    def test_very_short_input(self):
        self._assert_review("ok")

    def test_single_character(self):
        self._assert_review("a")

    def test_pure_punctuation(self):
        self._assert_review("!!! ??? ...")

    def test_cannot_explain(self):
        self._assert_review("I feel weird and cannot explain them at all.")

    def test_something_wrong_but_vague(self):
        self._assert_review("Something is wrong but i just can't explain it.")

    def test_test_sentence(self):
        self._assert_review("This is a test sentence for the API.")


# ─────────────────────────────────────────────────────────────────────────────
# DISCLAIMER COMPLETENESS — Spot-check across all urgency levels
# ─────────────────────────────────────────────────────────────────────────────

class TestDisclaimerAlwaysPresent:
    """Every single output must include the mandatory non-diagnostic disclaimer."""

    INPUTS = [
        "I have severe chest pain",            # EMERGENCY
        "I have a fever and vomiting",         # MEDIUM
        "I have a mild headache",              # LOW
        "qwerty",                              # REVIEW
        "I am wondering if I have a stroke",   # REVIEW (conditional)
        "My mother had chest pain",            # should not be EMERGENCY
        "Baby is not breathing",               # EMERGENCY (pediatric)
        "I want to end my life",               # EMERGENCY (self-harm)
        "Blood in my stool",                   # EMERGENCY (bleeding)
        "Mujhe seene mein dard hai",           # EMERGENCY (Hindi)
    ]

    def test_all_inputs_have_disclaimer(self):
        for text in self.INPUTS:
            result, _, _, _ = evaluate(text)
            assert result.get("disclaimer") == DISCLAIMER, (
                f"Missing or incorrect disclaimer for input: '{text}'"
            )
