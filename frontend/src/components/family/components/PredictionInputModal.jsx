import { useState } from 'react';
import { X, Sparkles, Activity, HeartPulse, ShieldCheck, Upload, Paperclip, FileText } from 'lucide-react';

export function PredictionInputModal({
  isOpen,
  onClose,
  modelType,
  member,
  records = [],
  onAddRecord,
  onSubmitPrediction,
}) {
  const [docSource, setDocSource] = useState('upload'); // 'upload' | 'existing'
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [selectedExistingRecordId, setSelectedExistingRecordId] = useState('');

  const [fractureData, setFractureData] = useState({
    anatomicalSite: 'Right Knee',
    injuryDate: '2026-09-14',
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

  // Filter records available for this member
  const memberRecords = records.filter(
    (r) => !r.patient || r.patient.toLowerCase() === member?.name?.toLowerCase()
  );

  const modelConfigs = {
    fracture: {
      title: 'Fracture Detection AI (ResNet-50 CNN)',
      department: 'Orthopedics',
      relatedDoctor: {
        name: 'Dr. Rahul Mehta',
        title: 'Dr. Rahul Mehta',
        role: 'Chief of Orthopedics',
        department: 'Orthopedics',
        hospital: 'MediMind Central Hospital',
        initials: 'RM',
        tone: 'coral',
      },
      icon: Activity,
      color: 'coral',
      description: 'Evaluates musculoskeletal X-ray radiographs with Grad-CAM heatmap localization to identify cortical disruptions, hairline fissures, or osteopathic fractures.',
      requiredText: 'Prerequisites: X-Ray image radiograph, anatomical region, and injury timeframe.',
    },
    diabetes: {
      title: 'Diabetes 3-Year Risk Forecaster (XGBoost)',
      department: 'Diabetology',
      relatedDoctor: {
        name: 'Dr. Kavya Shah',
        title: 'Dr. Kavya Shah',
        role: 'Senior Diabetologist & Endocrinologist',
        department: 'Diabetology',
        hospital: 'Manipal Hospital, Whitefield',
        initials: 'KS',
        tone: 'lilac',
      },
      icon: Activity,
      color: 'lilac',
      description: 'Predicts 3-year type-2 diabetes onset probability utilizing metabolic biomarkers, glycemic parameters, and patient demographic indicators.',
      requiredText: 'Prerequisites: Fasting glucose (mg/dL), HbA1c (%), BMI, and blood pressure.',
    },
    heart: {
      title: 'Cardiovascular Risk Engine (Framingham AI)',
      department: 'Cardiology',
      relatedDoctor: {
        name: 'Dr. Ananya Rao',
        title: 'Dr. Ananya Rao',
        role: 'Lead Cardiologist',
        department: 'Cardiology',
        hospital: 'Fortis Healthcare, Bannerghatta',
        initials: 'AR',
        tone: 'mint',
      },
      icon: HeartPulse,
      color: 'mint',
      description: 'Computes 5-year atherosclerotic cardiovascular disease (ASCVD) risk profile based on lipid levels, hemodynamics, and lifestyle factors.',
      requiredText: 'Prerequisites: Total cholesterol (mg/dL), systolic blood pressure, resting heart rate, and smoking history.',
    },
    general: {
      title: 'General Health Risk Synthesizer',
      department: 'General Medicine',
      relatedDoctor: {
        name: 'Dr. Kumar Iyer',
        title: 'Dr. Kumar Iyer',
        role: 'Senior Consultant - General Medicine',
        department: 'General Medicine',
        hospital: 'Apollo Hospitals, Greams Road',
        initials: 'KI',
        tone: 'coral',
      },
      icon: ShieldCheck,
      color: 'yellow',
      description: 'Synthesizes unified family health history, reported clinical symptoms, lifestyle indices, and recent records into a holistic decision-support risk estimate.',
      requiredText: 'Prerequisites: Current symptoms, lifestyle parameters, and family medical history.',
    },
  };

  const currentConfig = modelConfigs[modelType] || modelConfigs.general;
  const Icon = currentConfig.icon;

  const handleSubmit = (e) => {
    e.preventDefault();
    const patientName = member?.name || 'Father';
    const formattedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let attachedDoc = null;

    if (docSource === 'upload' && uploadedFileName) {
      // Save new record to unified Medical Records (Requirement 6 & 10)
      const newRec = {
        type: modelType === 'fracture' ? 'X-Ray radiograph' : `${currentConfig.title} Intake`,
        category: modelType === 'fracture' ? 'X-Rays' : 'Reports',
        patient: patientName,
        date: formattedDate,
        source: 'Uploaded by Family',
        description: `Uploaded document: ${uploadedFileName} for ${currentConfig.title}`,
        icon: FileText,
        color: 'blue',
        status: 'Available',
      };
      if (onAddRecord) {
        onAddRecord(newRec);
      }
      attachedDoc = {
        name: uploadedFileName,
        title: uploadedFileName,
        type: newRec.type,
        date: formattedDate,
        source: 'Uploaded by Family',
        record: newRec,
      };
    } else if (docSource === 'existing' && selectedExistingRecordId) {
      const found = memberRecords.find((r) => r.type === selectedExistingRecordId || `${r.type}-${r.date}` === selectedExistingRecordId);
      if (found) {
        attachedDoc = {
          name: `${found.type} (${found.date})`,
          title: found.title || found.type,
          type: found.type,
          date: found.date,
          source: 'Existing Medical Record',
          record: found,
        };
      }
    }

    let payload = {
      modelType,
      memberName: patientName,
      date: formattedDate,
      relatedDoctor: currentConfig.relatedDoctor,
      department: currentConfig.department,
      attachedDoc: attachedDoc,
      documentUsed: attachedDoc,
    };

    if (modelType === 'fracture') {
      payload = {
        ...payload,
        title: 'Fracture Detection Telemetry',
        score: '94%',
        result: 'No Acute Fracture Identified',
        riskLevel: 'Low Risk',
        details: fractureData,
        factors: [
          'Cortical margin integrity: Intact',
          'Joint space preservation: Normal',
          'Soft tissue swelling: Minimal',
          `Anatomical Region: ${fractureData.anatomicalSite}`,
        ],
        recommendation: 'Conservative supportive care, rest, and routine follow-up with orthopedic specialist if discomfort persists beyond 7 days.',
      };
    } else if (modelType === 'diabetes') {
      payload = {
        ...payload,
        title: 'Diabetes Risk Forecaster',
        score: '24%',
        result: 'Prediabetes Risk Zone',
        riskLevel: 'Moderate Risk',
        details: diabetesData,
        factors: [
          `Fasting Blood Glucose: ${diabetesData.glucose} mg/dL`,
          `HbA1c Level: ${diabetesData.hba1c}%`,
          `Body Mass Index (BMI): ${diabetesData.bmi}`,
          `Systolic Hemodynamics: ${diabetesData.bpSystolic} mmHg`,
        ],
        recommendation: 'Dietary carbohydrate titration, regular glycemic monitoring, and clinical review with diabetology care team in 3 months.',
      };
    } else if (modelType === 'heart') {
      payload = {
        ...payload,
        title: 'Heart Health & Cardiovascular Risk',
        score: '14%',
        result: 'Stable Cardiovascular Status (Score 86/100)',
        riskLevel: 'Low Risk',
        details: heartData,
        factors: [
          `Total Serum Cholesterol: ${heartData.cholesterol} mg/dL`,
          `Systolic BP: ${heartData.bpSystolic} mmHg`,
          `Resting Pulse: ${heartData.restingHr} bpm`,
          `Smoking Status: ${heartData.smoker}`,
        ],
        recommendation: 'Cardiovascular parameters remain optimal. Continue current aerobic activity schedule and routine annual cardiovascular screening.',
      };
    } else {
      payload = {
        ...payload,
        title: 'General Health Risk Synthesis',
        score: '18%',
        result: 'Low Priority / Routine Monitoring',
        riskLevel: 'Low Risk',
        details: generalData,
        factors: [
          'Reported symptoms: Mild',
          'Lifestyle habits: Positive aerobic baseline',
          'Family history: Mild hypertension risk factor',
        ],
        recommendation: 'Continue regular preventive health checkups, blood pressure logging, and routine primary care consults.',
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
        style={{ maxWidth: '580px' }}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--family-primary)', fontWeight: '600' }}>
            <span>Patient: {member?.name || 'Father'}</span>
            <span>Related Specialist: {currentConfig.relatedDoctor.name} ({currentConfig.department})</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Dual Document Option: Upload New or Use Existing (Requirement 6) */}
          <div style={{ margin: '0 0 14px 0', padding: '14px', backgroundColor: 'var(--family-card)', borderRadius: '10px', border: '1px solid var(--family-border)' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-ink)', display: 'block', marginBottom: '8px' }}>
              Document Prerequisite:
            </span>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setDocSource('upload')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: docSource === 'upload' ? 'var(--family-primary)' : 'var(--family-soft)',
                  color: docSource === 'upload' ? '#ffffff' : 'var(--family-ink)',
                  border: '1px solid var(--family-border)',
                }}
              >
                <Upload size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Option 1: Upload New Document
              </button>

              <button
                type="button"
                onClick={() => setDocSource('existing')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  backgroundColor: docSource === 'existing' ? 'var(--family-primary)' : 'var(--family-soft)',
                  color: docSource === 'existing' ? '#ffffff' : 'var(--family-ink)',
                  border: '1px solid var(--family-border)',
                }}
              >
                <Paperclip size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Option 2: Use Existing Medical Record ({memberRecords.length})
              </button>
            </div>

            {docSource === 'upload' && (
              <label className="drop-zone" style={{ margin: 0, padding: '14px' }}>
                <Upload size={20} style={{ color: 'var(--family-primary)' }} />
                <strong>{uploadedFileName || (modelType === 'fracture' ? 'Upload DICOM / PNG / JPEG Radiograph' : 'Upload Lab Report / PDF / Image')}</strong>
                <span>Document will automatically appear in {member?.name || 'Father'}'s Medical Records</span>
                <input
                  type="file"
                  accept="image/*,.pdf,.dcm"
                  onChange={(e) => setUploadedFileName(e.target.files?.[0]?.name || 'radiograph_scan.png')}
                />
              </label>
            )}

            {docSource === 'existing' && (
              <div>
                {memberRecords.length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--family-muted)' }}>
                    No existing records found for {member?.name}. Please upload a new document.
                  </span>
                ) : (
                  <select
                    className="feature-input"
                    value={selectedExistingRecordId}
                    onChange={(e) => setSelectedExistingRecordId(e.target.value)}
                  >
                    <option value="">-- Select an existing medical record --</option>
                    {memberRecords.map((r, idx) => (
                      <option key={`${r.type}-${idx}`} value={`${r.type}-${r.date}`}>
                        {r.type} · {r.date} ({r.source})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Model-Specific Inputs */}
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
            <span>AI telemetry supports clinical decisions and does not replace formal physician diagnosis.</span>
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
