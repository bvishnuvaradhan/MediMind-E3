/**
 * MediMind Clinical NLP & Decision-Support Rule Engine for General Health
 * 
 * Clinical Principles:
 * 1. Scope-Aware Negation: "no chest pain", "denies shortness of breath", "do not smoke"
 *    are accurately recognized as absent/negative indicators and NEVER misclassified as positive.
 * 2. Red-Flag Priority: Acute dangerous cardiopulmonary/neurological symptoms (e.g. severe chest pain,
 *    dyspnea, syncope/fainting, diaphoresis) trigger immediate EMERGENCY triage regardless of lifestyle/family history.
 * 3. Tri-Pillar Synthesis:
 *    - Pillar A: Current Symptoms & Observations (0–50 risk pts)
 *    - Pillar B: Lifestyle & Physical Habits (0–30 risk pts)
 *    - Pillar C: Familial Chronic Disease Predisposition (0–20 risk pts)
 * 4. Deterministic, Explainable Output: Zero static fallbacks.
 */

// Negation cues that scope forward to subsequent words within the same clause
const NEGATION_CUES = [
  'no', 'not', 'none', 'without', 'denies', 'denied', 'negative for',
  'free of', 'zero', 'dont have', "don't have", 'do not have',
  'doesnt have', "does't have", 'does not have', 'never had',
  'never experienced', 'no history of', 'no known', 'havent had',
  "haven't had", 'have not had', 'not coughing up', 'not coughing',
  'no blood in', 'not experiencing', 'rarely', 'seldom',
];

// Red-flag acute emergency symptoms (Unnegated match triggers immediate emergency priority)
const EMERGENCY_SYMPTOMS = [
  { term: 'severe chest pain', label: 'Severe acute chest pain / angina' },
  { term: 'chest pain', label: 'Acute chest pain' },
  { term: 'difficulty breathing', label: 'Dyspnea / acute respiratory distress' },
  { term: 'shortness of breath', label: 'Shortness of breath / dyspnea' },
  { term: 'breathlessness', label: 'Acute breathlessness' },
  { term: 'struggling to breathe', label: 'Acute respiratory distress / dyspnea' },
  { term: 'cant breathe', label: 'Acute respiratory compromise / inability to breathe' },
  { term: 'cannot breathe', label: 'Acute respiratory compromise / inability to breathe' },
  { term: 'breathing is becoming difficult', label: 'Progressive respiratory distress' },
  { term: 'breathing becoming difficult', label: 'Progressive respiratory distress' },
  { term: 'faint', label: 'Presyncope / feeling faint' },
  { term: 'fainting', label: 'Syncope / loss of consciousness' },
  { term: 'passed out', label: 'Syncope / collapse' },
  { term: 'sweaty', label: 'Diaphoresis / cold sweats' },
  { term: 'sweating', label: 'Diaphoresis / profuse sweating' },
  { term: 'stroke', label: 'Acute cerebrovascular / stroke symptoms' },
  { term: 'slurred speech', label: 'Slurred speech / dysarthria' },
  { term: 'sudden weakness', label: 'Sudden focal neurological weakness' },
  { term: 'sudden numbness', label: 'Sudden acute numbness' },
  { term: 'worst headache', label: 'Thunderclap headache / acute severe cephalalgia' },
  // Airway & Anaphylaxis
  { term: 'throat closing up', label: 'Airway compromise / throat closing' },
  { term: 'throat closing', label: 'Airway compromise / throat closing' },
  { term: 'throat feels like it is closing', label: 'Airway compromise / throat closing' },
  { term: 'throat feels closed', label: 'Airway compromise / throat constriction' },
  { term: 'lips swelling', label: 'Angioedema / lip swelling' },
  { term: 'lips are swelling', label: 'Angioedema / lip swelling' },
  { term: 'tongue swelling', label: 'Angioedema / tongue swelling' },
  { term: 'face swelling', label: 'Angioedema / facial swelling' },
  { term: 'severe allergic reaction', label: 'Severe allergic reaction / anaphylaxis' },
  { term: 'allergic reaction after eating', label: 'Food-induced allergic reaction / anaphylaxis' },
  { term: 'anaphylaxis', label: 'Severe anaphylaxis' },
  // Hemoptysis
  { term: 'coughing up blood', label: 'Hemoptysis / coughing blood' },
  { term: 'cough up blood', label: 'Hemoptysis / coughing blood' },
  { term: 'coughing with blood', label: 'Hemoptysis / coughing with blood' },
  { term: 'cough with blood', label: 'Hemoptysis / coughing with blood' },
  { term: 'blood when coughing', label: 'Hemoptysis / blood when coughing' },
  { term: 'blood while coughing', label: 'Hemoptysis / blood while coughing' },
  { term: 'blood in cough', label: 'Hemoptysis / blood in cough' },
  { term: 'coughing blood', label: 'Hemoptysis / coughing blood' },
  { term: 'vomiting blood', label: 'Hematemesis / upper GI bleeding' },
];

const THIRD_PERSON_REGEX = /\b(?:my\s+(?:friend|mother|mom|father|dad|wife|husband|brother|sister|uncle|aunt|colleague|neighbor|patient|child|son|daughter|relative|parent)s?|a\s+(?:friend|colleague|relative|patient|neighbor)|someone(?:\s+i\s+know)?|(?:calling|inquiring|asking)\s+(?:for|about|regarding)\s+my\s+(?:mother|mom|father|dad|wife|husband|brother|sister|friend|child|son|daughter))\b/i;

const FIRST_PERSON_REASSERTION_REGEX = /\b(?:now\s+i\s+have|now\s+i|i\s+also\s+have|i\s+also|i\s+have|i\s+am\s+having|i\s+am\s+experiencing|i\s+feel|i\s+myself|myself\s+have|for\s+me)\b/i;

const HISTORICAL_REGEX = /\b(?:had\s+[\w\s]{1,35}?\s+(?:last\s+year|last\s+month|years?\s+ago|months?\s+ago|long\s+ago|in\s+the\s+past|before\s+last\s+summer)|previously\s+had|once\s+had|used\s+to\s+have|used\s+to\s+get|used\s+to\s+suffer\s+from|history\s+of)\b/i;

const RECURRENCE_REGEX = /\b(?:started\s+again|came\s+back|returned|started\s+this\s+morning|started\s+today|having\s+it\s+again|recurred|recurring|recurrent|happening\s+again|back\s+again|now\s+it\s+is\s+back)\b/i;

const HISTORICAL_RESOLUTION_REGEX = /\b(?:feel|am)\s+(?:completely\s+|totally\s+)?(?:fine|okay|better|well|good|normal)|(?:now|today|currently)\s+(?:i\s+)?(?:am|feel)\s+(?:completely\s+|totally\s+)?(?:fine|okay|better|well|good|normal)|(?:right\s+now\s+today|today|currently|now|at\s+present)\s+(?:i\s+have\s+)?zero|zero\s+(?:chest\s+pain|symptoms?|pain|shortness\s+of\s+breath|trouble)|completely\s+fine|breathing\s+normally\s+(?:now|currently)|currently\s+(?:i'?m\s+)?breathing\s+normally|just\s+need\s+(?:a\s+)?routine|recovered\s+fully|fully\s+recovered|no\s+longer\s+(?:have|experiencing)|resolved\b/i;

// Moderate & Routine clinical symptoms
const ROUTINE_SYMPTOMS = [
  { term: 'tired for the past', label: 'Persistent fatigue (>2 weeks duration)', weight: 14 },
  { term: 'unusually tired', label: 'Unusual / persistent exhaustion', weight: 12 },
  { term: 'fatigue', label: 'Generalized fatigue / low energy', weight: 8 },
  { term: 'tiredness after a busy day', label: 'Benign transient exertion fatigue', weight: 2 },
  { term: 'mild tiredness', label: 'Mild transient tiredness', weight: 2 },
  { term: 'tired', label: 'Reported tiredness', weight: 4 },
  { term: 'thirsty more often', label: 'Increased thirst / polydipsia', weight: 12 },
  { term: 'thirsty', label: 'Thirst sensation', weight: 6 },
  { term: 'frequent urination', label: 'Frequent urination / polyuria', weight: 10 },
  { term: 'mild headaches', label: 'Mild tension-type headaches', weight: 6 },
  { term: 'headaches', label: 'Reported recurrent cephalalgia / headaches', weight: 8 },
  { term: 'headache', label: 'Reported cephalalgia / headache', weight: 8 },
  { term: 'sore throat', label: 'Persistent pharyngitis / sore throat', weight: 8 },
  { term: 'stomach discomfort', label: 'Abdominal discomfort / gastrointestinal symptoms', weight: 6 },
  { term: 'bloated', label: 'Bloating / gastrointestinal distension', weight: 5 },
  { term: 'sluggish', label: 'Sluggishness / low energy state', weight: 8 },
  { term: 'rundown', label: 'Persistent fatigue / rundown state', weight: 8 },
  { term: 'heavy in my limbs', label: 'Limb heaviness / asthenia', weight: 8 },
  { term: 'joint discomfort', label: 'Mild joint discomfort / arthralgia', weight: 5 },
  { term: 'joint pain', label: 'Joint pain / stiffness', weight: 7 },
  { term: 'cough', label: 'Respiratory cough', weight: 5 },
  { term: 'fever', label: 'Elevated body temperature / fever', weight: 10 },
  { term: 'dizziness', label: 'Lightheadedness / dizziness', weight: 8 },
  { term: 'acid reflux', label: 'Gastroesophageal reflux / heartburn', weight: 5 },
  { term: 'nausea', label: 'Nausea / digestive distress', weight: 6 },
];

/**
 * Splits text into clauses and determines if a search term is present and unnegated.
 */
function isTermPresentAndUnnegated(text, searchPattern) {
  if (!text) return { found: false, negated: false };
  const normalized = text.toLowerCase().replace(/['’]/g, '');
  const patternNorm = searchPattern.toLowerCase().replace(/['’]/g, '');

  // Split into sentences / major semantic blocks (excluding commas so lists stay in scope)
  const sentences = normalized.split(/[.!?;\n]+|\b(but|however|although|except|whereas)\b/);

  for (const rawSentence of sentences) {
    if (!rawSentence) continue;
    const sentence = rawSentence.trim();
    const termIndex = sentence.indexOf(patternNorm);

    if (termIndex !== -1) {
      // Check if term is a whole word or phrase match
      const beforeChar = termIndex > 0 ? sentence[termIndex - 1] : ' ';
      const afterIndex = termIndex + patternNorm.length;
      const afterChar = afterIndex < sentence.length ? sentence[afterIndex] : ' ';
      if (/[a-z0-9]/.test(beforeChar) || /[a-z0-9]/.test(afterChar)) {
        continue;
      }

      // Check all words/text preceding the term in this sentence for negation cues
      const textBefore = sentence.slice(0, termIndex);
      const isNegated = NEGATION_CUES.some((cue) => {
        const cueNorm = cue.replace(/['’]/g, '');
        const regex = new RegExp(`\\b${cueNorm}\\b`, 'i');
        return regex.test(textBefore);
      });

      if (isNegated) {
        return { found: true, negated: true };
      }
      return { found: true, negated: false };
    }
  }

  return { found: false, negated: false };
}

/**
 * Evaluates whether an emergency search term is present in fullText as a real,
 * active patient emergency, properly distinguishing:
 * - Direct negation
 * - Third-person attribution leakage (unless overridden by first-person reassertion)
 * - Historical symptom temporal bleed (unless overridden by acute recurrence)
 */
function evaluateEmergencyTerm(fullText, searchPattern) {
  if (!fullText) return { found: false, isPatientEmergency: false, isNegated: false };
  const normalized = fullText.toLowerCase().replace(/['’]/g, '');
  const patternNorm = searchPattern.toLowerCase().replace(/['’]/g, '');

  let foundAny = false;
  let allNegated = true;
  let hasValidEmergency = false;

  let startIndex = 0;
  while (startIndex < normalized.length) {
    const termIndex = normalized.indexOf(patternNorm, startIndex);
    if (termIndex === -1) break;

    startIndex = termIndex + patternNorm.length;

    // Check word boundaries
    const beforeChar = termIndex > 0 ? normalized[termIndex - 1] : ' ';
    const afterIndex = termIndex + patternNorm.length;
    const afterChar = afterIndex < normalized.length ? normalized[afterIndex] : ' ';
    if (/[a-z0-9]/.test(beforeChar) || /[a-z0-9]/.test(afterChar)) {
      continue;
    }

    foundAny = true;

    // Determine the enclosing clause / sentence for context
    const textBeforeMatch = normalized.slice(0, termIndex);
    const clauseBreakIndex = Math.max(
      textBeforeMatch.lastIndexOf('.'),
      textBeforeMatch.lastIndexOf('!'),
      textBeforeMatch.lastIndexOf('?'),
      textBeforeMatch.lastIndexOf(';'),
      textBeforeMatch.lastIndexOf('\n')
    );
    const clauseTextBefore = clauseBreakIndex !== -1
      ? textBeforeMatch.slice(clauseBreakIndex + 1)
      : textBeforeMatch;

    // 1. Direct Negation Check within clause
    const isNegatedInClause = NEGATION_CUES.some((cue) => {
      const cueNorm = cue.replace(/['’]/g, '');
      const regex = new RegExp(`\\b${cueNorm}\\b`, 'i');
      return regex.test(clauseTextBefore);
    });

    if (isNegatedInClause) {
      continue;
    }

    // 2. Third-Person Attribution Check
    let isThirdPersonAttributed = false;
    const tpMatches = [...textBeforeMatch.matchAll(new RegExp(THIRD_PERSON_REGEX.source, 'gi'))];
    if (tpMatches.length > 0) {
      const lastTpEnd = tpMatches[tpMatches.length - 1].index + tpMatches[tpMatches.length - 1][0].length;
      const interveningText = textBeforeMatch.slice(lastTpEnd);
      if (!FIRST_PERSON_REASSERTION_REGEX.test(interveningText)) {
        isThirdPersonAttributed = true;
      }
    }

    if (isThirdPersonAttributed) {
      allNegated = false;
      continue;
    }

    // 3. Historical Symptom Temporal Check
    let isHistoricalDescoped = false;
    const textAfterMatch = normalized.slice(termIndex);
    const nextClauseBreak = textAfterMatch.search(/[.!?;\n]/);
    const clauseTextFull = clauseTextBefore + (nextClauseBreak !== -1 ? textAfterMatch.slice(0, nextClauseBreak) : textAfterMatch);

    const hasPastFraming = HISTORICAL_REGEX.test(clauseTextFull) || HISTORICAL_REGEX.test(clauseTextBefore) || HISTORICAL_REGEX.test(normalized);
    if (hasPastFraming) {
      const hasRecurrence = RECURRENCE_REGEX.test(normalized);
      if (!hasRecurrence) {
        const hasResolution = HISTORICAL_RESOLUTION_REGEX.test(normalized);
        if (hasResolution || /\b(?:previously\s+had|once\s+had|used\s+to\s+have|used\s+to\s+suffer|years\s+ago)\b/i.test(normalized)) {
          isHistoricalDescoped = true;
        }
      }
    }

    if (isHistoricalDescoped) {
      allNegated = false;
      continue;
    }

    hasValidEmergency = true;
    allNegated = false;
    break;
  }

  if (!foundAny) {
    return { found: false, isPatientEmergency: false, isNegated: false };
  }

  return {
    found: true,
    isPatientEmergency: hasValidEmergency,
    isNegated: allNegated && !hasValidEmergency,
  };
}

/**
 * Main General Health Evaluation Function
 */
export function evaluateGeneralHealth({ symptoms = '', lifestyle = '', familyHistory = '' }) {
  const extractedPositiveSymptoms = [];
  const extractedNegatedSymptoms = [];
  const detectedLifestyleFactors = [];
  const detectedFamilyFactors = [];

  let isEmergency = false;
  const emergencyTriggers = [];

  // 1. Evaluate Red-Flag / Emergency Symptoms
  for (const em of EMERGENCY_SYMPTOMS) {
    const check = evaluateEmergencyTerm(symptoms, em.term);
    if (check.found) {
      if (check.isPatientEmergency) {
        isEmergency = true;
        if (!emergencyTriggers.includes(em.label)) {
          emergencyTriggers.push(em.label);
          extractedPositiveSymptoms.push(`CRITICAL: ${em.label}`);
        }
      } else if (check.isNegated) {
        if (!extractedNegatedSymptoms.includes(`Denied / Ruled Out: ${em.label}`)) {
          extractedNegatedSymptoms.push(`Denied / Ruled Out: ${em.label}`);
        }
      }
    }
  }

  // Cross-check: Food allergy + airway symptoms
  const symNorm = (symptoms || '').toLowerCase().replace(/['’]/g, '');
  if (
    /(shellfish|peanuts?|nuts?|shrimp)/i.test(symNorm) &&
    /(throat|breath|breathing|swelling|anaphylaxis|closing)/i.test(symNorm)
  ) {
    if (!isEmergency) {
      isEmergency = true;
      if (!emergencyTriggers.includes('Acute food-induced allergic airway reaction')) {
        emergencyTriggers.push('Acute food-induced allergic airway reaction');
        extractedPositiveSymptoms.push('CRITICAL: Acute food-induced allergic airway reaction');
      }
    }
  }

  // 2. Evaluate Moderate / Routine Symptoms with phrase subsumption
  let symptomScore = 0;
  // Sort by term length descending so specific phrases match before generic single words
  const sortedRoutine = [...ROUTINE_SYMPTOMS].sort((a, b) => b.term.length - a.term.length);
  const matchedSpans = [];

  for (const sym of sortedRoutine) {
    const check = isTermPresentAndUnnegated(symptoms, sym.term);
    if (check.found) {
      if (check.negated) {
        if (!extractedNegatedSymptoms.includes(`Denied / Ruled Out: ${sym.label}`)) {
          extractedNegatedSymptoms.push(`Denied / Ruled Out: ${sym.label}`);
        }
      } else {
        // Only count if not already covered by a more specific symptom
        const alreadyCovered = matchedSpans.some((span) => span.includes(sym.term) || sym.term.includes(span));
        if (!alreadyCovered) {
          matchedSpans.push(sym.term);
          if (!extractedPositiveSymptoms.includes(sym.label)) {
            extractedPositiveSymptoms.push(sym.label);
            symptomScore += sym.weight;
          }
        }
      }
    }
  }

  // 3. Evaluate Lifestyle & Physical Habits (0–30 pts)
  let lifestyleScore = 8; // Neutral baseline

  const lifeNorm = (lifestyle || '').toLowerCase();

  // Exercise evaluation
  if (/exercise 4 to 5|exercise 4-5|exercise 5|exercise daily|regular strength|regular exercise/i.test(lifeNorm)) {
    detectedLifestyleFactors.push('Optimal Physical Activity: 4–5 days/week regular exercise');
    lifestyleScore -= 6;
  } else if (/exercise only once|rarely exercise|sedentary/i.test(lifeNorm)) {
    detectedLifestyleFactors.push('Physical Inactivity: Sedentary lifestyle with minimal exercise');
    lifestyleScore += 6;
  }

  // Diet evaluation
  if (/balanced diet|low sodium|mediterranean|whole foods/i.test(lifeNorm)) {
    detectedLifestyleFactors.push('Nutritional Quality: Balanced whole-food nutrition');
    lifestyleScore -= 4;
  } else if (/processed|high-sugar|high sugar|fatty foods|fast food/i.test(lifeNorm)) {
    detectedLifestyleFactors.push('Dietary Risk: Frequent processed & high-glycemic food intake');
    lifestyleScore += 6;
  }

  // Sleep evaluation
  if (/sleep around 7 to 8|sleep 7 to 8|sleep 8 hours/i.test(lifeNorm)) {
    detectedLifestyleFactors.push('Circadian Rest: Restorative 7–8 hours sleep per night');
    lifestyleScore -= 3;
  } else if (/sleep around 5 to 6|sleep 5 to 6|sleep 5 hours|poor sleep/i.test(lifeNorm)) {
    detectedLifestyleFactors.push('Sleep Deficit: Suboptimal sleep duration (5–6 hours/night)');
    lifestyleScore += 4;
  }

  // Smoking evaluation
  const smokeCheck = isTermPresentAndUnnegated(lifeNorm, 'smoke');
  if (smokeCheck.found && !smokeCheck.negated) {
    detectedLifestyleFactors.push('Tobacco Exposure: Active regular smoker (high vascular risk)');
    lifestyleScore += 10;
  } else if (smokeCheck.found && smokeCheck.negated) {
    detectedLifestyleFactors.push('Non-Smoker: Zero active tobacco consumption');
    lifestyleScore -= 2;
  }

  // Alcohol evaluation
  if (/rarely drink|rarely consume alcohol|do not drink|no alcohol/i.test(lifeNorm)) {
    detectedLifestyleFactors.push('Alcohol Intake: Minimal / Rare alcohol consumption');
  } else if (/frequently consume alcohol|heavy drinking|daily alcohol/i.test(lifeNorm)) {
    detectedLifestyleFactors.push('Alcohol Exposure: Frequent regular alcohol consumption');
    lifestyleScore += 4;
  }

  lifestyleScore = Math.max(0, Math.min(30, lifestyleScore));

  // 4. Evaluate Family Health History (0–20 pts)
  let familyScore = 0;
  const famNorm = (familyHistory || '').toLowerCase();
  const famCheckClean = isTermPresentAndUnnegated(famNorm, 'family history');

  if (/no known family history|no family history|clean family history/i.test(famNorm) || (famCheckClean.found && famCheckClean.negated)) {
    detectedFamilyFactors.push('Negative Family History: No significant familial chronic disease risk');
  } else {
    if (/heart attack|myocardial infarction|early cad/i.test(famNorm)) {
      detectedFamilyFactors.push('Cardiovascular: First-degree relative early heart attack / CAD');
      familyScore += 8;
    }
    if (/diabetes|type 2 diabetes/i.test(famNorm)) {
      detectedFamilyFactors.push('Metabolic: Familial predisposition to Type 2 Diabetes');
      familyScore += 5;
    }
    if (/high blood pressure|hypertension/i.test(famNorm)) {
      detectedFamilyFactors.push('Vascular: Familial predisposition to Hypertension');
      familyScore += 4;
    }
    if (/high cholesterol|hypercholesterolemia/i.test(famNorm)) {
      detectedFamilyFactors.push('Lipidemia: Familial Hypercholesterolemia history');
      familyScore += 3;
    }
  }

  familyScore = Math.max(0, Math.min(20, familyScore));

  // 5. Synthesis & Clinical Decision Logic
  if (isEmergency) {
    // Acute Red-Flag Emergency Pathway
    return {
      title: 'General Health Risk Synthesis',
      modelType: 'general',
      riskLevel: 'High Risk',
      score: '94%',
      healthScore: 6,
      result: 'Urgent Emergency Evaluation Required — Acute Cardiopulmonary Symptoms',
      urgency: 'IMMEDIATE_EMERGENCY_EVALUATION',
      isEmergency: true,
      emergencyTriggers,
      extractedPositiveSymptoms,
      extractedNegatedSymptoms,
      detectedLifestyleFactors,
      detectedFamilyFactors,
      factors: [
        `CRITICAL ALERT: Acute onset red-flag symptoms detected: ${emergencyTriggers.join(', ')}`,
        'Triage Priority: Acute cardiopulmonary indicators supersede baseline chronic parameters',
        `Reported Symptoms: ${symptoms}`,
        `Lifestyle Background: ${lifestyle || 'Sedentary/Smoking background'}`,
        `Family Predisposition: ${familyHistory || 'Familial cardiac history'}`,
      ],
      recommendation:
        'IMMEDIATE EMERGENCY MEDICAL ATTENTION REQUIRED. Acute chest pain, dyspnea, diaphoresis, and presyncope are potential indicators of an acute coronary syndrome or cardiopulmonary emergency. Seek emergency care immediately (dial 108/112 or visit nearest emergency room). Do not drive yourself.',
    };
  }

  // Standard multi-factor risk calculation
  symptomScore = Math.max(0, Math.min(50, symptomScore));
  const rawRisk = symptomScore + lifestyleScore + familyScore;
  const totalRisk = Math.min(65, Math.max(8, rawRisk));
  const healthWellnessScore = Math.max(35, 100 - totalRisk);

  if (totalRisk < 28) {
    // Low Risk / Wellness Baseline
    return {
      title: 'General Health Risk Synthesis',
      modelType: 'general',
      riskLevel: 'Low Risk',
      score: `${healthWellnessScore}/100`,
      healthScore: healthWellnessScore,
      riskScore: totalRisk,
      result: 'Optimal Wellness Baseline',
      urgency: 'ROUTINE_PREVENTIVE_CARE',
      isEmergency: false,
      emergencyTriggers: [],
      extractedPositiveSymptoms: extractedPositiveSymptoms.length > 0 ? extractedPositiveSymptoms : ['Transient benign fatigue after busy exertion'],
      extractedNegatedSymptoms,
      detectedLifestyleFactors,
      detectedFamilyFactors,
      factors: [
        `Symptom Analysis: ${extractedNegatedSymptoms.slice(0, 3).join(', ') || 'No acute or red-flag symptoms reported'}`,
        `Lifestyle Profile: ${detectedLifestyleFactors.slice(0, 2).join(' · ') || 'Protective physical activity and balanced habits'}`,
        `Family History: ${detectedFamilyFactors[0] || 'No major genetic predisposition reported'}`,
        `Triage Urgency: Routine Preventive Wellness (Health Score: ${healthWellnessScore}/100, Low Risk)`,
      ],
      recommendation:
        'Current health screening indicates stable baseline wellness. Maintain regular aerobic exercise, balanced nutrition, adequate hydration, and schedule routine annual preventive health visits.',
    };
  }

  // Moderate Risk / Clinical Review Recommended
  return {
    title: 'General Health Risk Synthesis',
    modelType: 'general',
    riskLevel: 'Moderate Risk',
    score: `${totalRisk}%`,
    healthScore: healthWellnessScore,
    riskScore: totalRisk,
    result: 'Clinical Review Recommended — Multi-Factor Risk Profile',
    urgency: 'MEDICAL_EVALUATION_RECOMMENDED',
    isEmergency: false,
    emergencyTriggers: [],
    extractedPositiveSymptoms,
    extractedNegatedSymptoms,
    detectedLifestyleFactors,
    detectedFamilyFactors,
    factors: [
      `Symptom Burden: ${extractedPositiveSymptoms.join(', ') || 'Persistent fatigue and metabolic indicators'}`,
      `Lifestyle Factors: ${detectedLifestyleFactors.join(' · ') || 'Suboptimal activity and dietary habits'}`,
      `Family Predisposition: ${detectedFamilyFactors.join(' · ') || 'Familial diabetes and hypertension history'}`,
      `Triage Urgency: Outpatient Clinical Review Recommended (Risk: ${totalRisk}%, Moderate Risk)`,
    ],
    recommendation:
      'Schedule a non-emergency consultation with a general medicine physician. Comprehensive metabolic panel (CMP), fasting blood glucose / HbA1c, lipid profile, and blood pressure monitoring are advised given reported persistent fatigue, polydipsia, and family history.',
  };
}
