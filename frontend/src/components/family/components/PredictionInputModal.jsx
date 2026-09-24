import { useState } from 'react';
import { X, Sparkles, Activity, HeartPulse, ShieldCheck, Upload } from 'lucide-react';

export function PredictionInputModal({
  isOpen,
  onClose,
  modelType,
  member,
  onSubmitPrediction,
}) {
  const [fractureData, setFractureData] = useState({
    anatomicalSite: 'Right Knee',
    injuryDate: '2026-09-14',
    fileName: '',
    painLevel: '7',
  });

  const [diabetesData, setDiabetesData] = useState({
    glucose: '128',
    hba1c: '6.4',
    bmi: '26.8',
    bpSystolic: '135',
    familyHistory: 'Yes',
  });

  const [heartData, setHeartData] = useState({
    cholesterol: '215',
    bpSystolic: '138',
    restingHr: '76',
    smoker: 'No',
    activityLevel: 'Moderate',
  });

  const [generalData, setGeneralData] = useState({
    symptoms: 'Occasional morning fatigue and mild joint discomfort',
    lifestyle: 'Walks 30 mins 4x/week, low sodium diet',
    familyHistory: 'Father had hypertension at age 58',
  });

  if (!isOpen) return null;

  const modelConfigs = {
    fracture: {
      title: 'Fracture Detection AI (ResNet-50 CNN)',
      icon: Activity,
      color: 'coral',
      description: 'Evaluates musculoskeletal X-ray radiographs with Grad-CAM heatmap localization to identify cortical disruptions, hairline fissures, or osteopathic fractures.',
      requiredText: 'Required: X-Ray image radiograph, anatomical region, and injury timeframe.',
    },
    diabetes: {
      title: 'Diabetes 3-Year Risk Forecaster (XGBoost)',
      icon: Activity,
      color: 'lilac',
      description: 'Predicts 3-year type-2 diabetes onset probability utilizing metabolic biomarkers, glycemic parameters, and patient demographic indicators.',
      requiredText: 'Required: Fasting glucose (mg/dL), HbA1c (%), BMI, and blood pressure.',
    },
    heart: {
      title: 'Cardiovascular Risk Engine (Framingham AI)',
      icon: HeartPulse,
      color: 'mint',
      description: 'Computes 5-year atherosclerotic cardiovascular disease (ASCVD) risk profile based on lipid levels, hemodynamics, and lifestyle factors.',
      requiredText: 'Required: Total cholesterol (mg/dL), systolic blood pressure, resting heart rate, and smoking history.',
    },
    general: {
      title: 'General Health Risk Synthesizer',
      icon: ShieldCheck,
      color: 'yellow',
      description: 'Synthesizes unified family health history, reported clinical symptoms, lifestyle indices, and recent records into a holistic decision-support risk estimate.',
      requiredText: 'Required: Current symptoms, lifestyle parameters, and family medical history.',
    },
  };

  const currentConfig = modelConfigs[modelType] || modelConfigs.general;
  const Icon = currentConfig.icon;

  const handleSubmit = (e) => {
    e.preventDefault();
    let payload = { modelType, memberName: member?.name || 'Father', date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) };

    if (modelType === 'fracture') {
      payload = {
        ...payload,
        title: 'Fracture Detection Telemetry',
        score: '94%',
        result: 'No Acute Fracture Identified',
        riskLevel: 'Low Risk',
        details: fractureData,
        factors: ['Cortical margin integrity: Intact', 'Joint space preservation: Normal', 'Soft tissue swelling: Minimal'],
        recommendation: 'Conservative supportive care, rest, and routine follow-up if discomfort persists beyond 7 days.',
      };
    } else if (modelType === 'diabetes') {
      payload = {
        ...payload,
        title: 'Diabetes Risk Forecaster',
        score: '24%',
        result: 'Prediabetes Risk Zone',
        riskLevel: 'Moderate Risk',
        details: diabetesData,
        factors: [`Fasting Blood Glucose: ${diabetesData.glucose} mg/dL`, `HbA1c: ${diabetesData.hba1c}%`, `Body Mass Index: ${diabetesData.bmi}`],
        recommendation: 'Dietary carbohydrate titration, regular glycemic monitoring, and repeat HbA1c in 3 months.',
      };
    } else if (modelType === 'heart') {
      payload = {
        ...payload,
        title: 'Heart Health & Cardiovascular Risk',
        score: '14%',
        result: 'Stable Cardiovascular Status (Score 86/100)',
        riskLevel: 'Low Risk',
        details: heartData,
        factors: [`Total Serum Cholesterol: ${heartData.cholesterol} mg/dL`, `Systolic BP: ${heartData.bpSystolic} mmHg`, `Resting Pulse: ${heartData.restingHr} bpm`],
        recommendation: 'Maintain current aerobic activity schedule and routine annual cardiovascular screening.',
      };
    } else {
      payload = {
        ...payload,
        title: 'General Health Risk Synthesis',
        score: '18%',
        result: 'Low Priority / Routine Monitoring',
        riskLevel: 'Low Risk',
        details: generalData,
        factors: ['Reported symptoms: Mild', 'Lifestyle habits: Positive aerobic baseline', 'Family history: Mild hypertension risk factor'],
        recommendation: 'Continue regular preventive health checkups and blood pressure logging.',
      };
    }

    onSubmitPrediction(payload);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal prediction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prediction-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className={`modal-icon ${currentConfig.color}-bg`} style={{ margin: 0 }}>
              <Icon size={20} />
            </div>
            <div>
              <p className="eyebrow">AI Clinical Decision Support</p>
              <h2 id="prediction-modal-title" style={{ margin: 0, fontSize: '18px' }}>
                {currentConfig.title}
              </h2>
            </div>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close AI prediction modal">
            <X size={18} />
          </button>
        </div>

        <div style={{ margin: '14px 0', padding: '12px 14px', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
          <p style={{ fontSize: '13px', color: 'var(--family-ink)', lineHeight: '1.4', margin: '0 0 6px 0' }}>
            {currentConfig.description}
          </p>
          <span style={{ fontSize: '12px', color: 'var(--family-primary)', fontWeight: '600' }}>
            Patient: {member?.name || 'Father'} · {currentConfig.requiredText}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          {modelType === 'fracture' && (
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Anatomical Site *</span>
                <select
                  className="feature-input"
                  value={fractureData.anatomicalSite}
                  onChange={(e) => setFractureData({ ...fractureData, anatomicalSite: e.target.value })}
                >
                  <option>Right Knee</option>
                  <option>Left Knee</option>
                  <option>Right Wrist</option>
                  <option>Left Wrist</option>
                  <option>Right Ankle</option>
                  <option>Left Ankle</option>
                  <option>Shoulder</option>
                  <option>Hip / Pelvis</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Date of Injury</span>
                <input
                  type="date"
                  className="feature-input"
                  value={fractureData.injuryDate}
                  onChange={(e) => setFractureData({ ...fractureData, injuryDate: e.target.value })}
                />
              </label>

              <label className="drop-zone" style={{ gridColumn: 'span 2', padding: '16px' }}>
                <Upload size={24} style={{ color: 'var(--family-primary)' }} />
                <strong>{fractureData.fileName || 'Upload DICOM / JPEG / PNG Radiograph'}</strong>
                <span>X-ray scans are analyzed securely on-device</span>
                <input
                  type="file"
                  accept="image/*,.dcm"
                  onChange={(e) => setFractureData({ ...fractureData, fileName: e.target.files?.[0]?.name || 'knee_radiograph_ap_lat.png' })}
                />
              </label>
            </div>
          )}

          {modelType === 'diabetes' && (
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Fasting Glucose (mg/dL) *</span>
                <input
                  type="number"
                  className="feature-input"
                  value={diabetesData.glucose}
                  onChange={(e) => setDiabetesData({ ...diabetesData, glucose: e.target.value })}
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>HbA1c Level (%) *</span>
                <input
                  type="number"
                  step="0.1"
                  className="feature-input"
                  value={diabetesData.hba1c}
                  onChange={(e) => setDiabetesData({ ...diabetesData, hba1c: e.target.value })}
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Body Mass Index (BMI)</span>
                <input
                  type="number"
                  step="0.1"
                  className="feature-input"
                  value={diabetesData.bmi}
                  onChange={(e) => setDiabetesData({ ...diabetesData, bmi: e.target.value })}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Systolic BP (mmHg)</span>
                <input
                  type="number"
                  className="feature-input"
                  value={diabetesData.bpSystolic}
                  onChange={(e) => setDiabetesData({ ...diabetesData, bpSystolic: e.target.value })}
                />
              </label>
            </div>
          )}

          {modelType === 'heart' && (
            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Total Cholesterol (mg/dL) *</span>
                <input
                  type="number"
                  className="feature-input"
                  value={heartData.cholesterol}
                  onChange={(e) => setHeartData({ ...heartData, cholesterol: e.target.value })}
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Systolic Blood Pressure (mmHg) *</span>
                <input
                  type="number"
                  className="feature-input"
                  value={heartData.bpSystolic}
                  onChange={(e) => setHeartData({ ...heartData, bpSystolic: e.target.value })}
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Resting Heart Rate (bpm)</span>
                <input
                  type="number"
                  className="feature-input"
                  value={heartData.restingHr}
                  onChange={(e) => setHeartData({ ...heartData, restingHr: e.target.value })}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Smoking Status</span>
                <select
                  className="feature-input"
                  value={heartData.smoker}
                  onChange={(e) => setHeartData({ ...heartData, smoker: e.target.value })}
                >
                  <option>No</option>
                  <option>Former Smoker</option>
                  <option>Active Smoker</option>
                </select>
              </label>
            </div>
          )}

          {modelType === 'general' && (
            <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Symptoms or General Health Concerns *</span>
                <textarea
                  className="feature-input"
                  rows={2}
                  value={generalData.symptoms}
                  onChange={(e) => setGeneralData({ ...generalData, symptoms: e.target.value })}
                  placeholder="e.g. Mild headache, fatigue..."
                  required
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Lifestyle Information</span>
                <input
                  className="feature-input"
                  value={generalData.lifestyle}
                  onChange={(e) => setGeneralData({ ...generalData, lifestyle: e.target.value })}
                  placeholder="e.g. Exercise routine, sleep hours, diet..."
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Family Health History</span>
                <input
                  className="feature-input"
                  value={generalData.familyHistory}
                  onChange={(e) => setGeneralData({ ...generalData, familyHistory: e.target.value })}
                  placeholder="e.g. Hypertension, cardiac history..."
                />
              </label>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '14px 0 0', color: 'var(--family-muted)', fontSize: '11.5px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--family-primary)', flexShrink: 0 }} />
            <span>AI results are for decision-support and do not replace formal physician diagnosis.</span>
          </div>

          <div className="modal-actions" style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              <Sparkles size={16} /> Run AI Assessment
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
