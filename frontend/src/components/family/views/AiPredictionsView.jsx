import { useState } from 'react';
import { Sparkles, Activity, HeartPulse, ShieldCheck, ArrowUpRight, History, FileText, Stethoscope } from 'lucide-react';
import { PredictionInputModal } from '../components/PredictionInputModal';

export function AiPredictionsView({
  member,
  records = [],
  predictionHistory = [],
  navigate,
  announce,
  onOpenPredictionDetail,
  onAddPrediction,
  onAddRecord,
}) {
  const [selectedModel, setSelectedModel] = useState(null);

  const defaultHistory = [
    {
      id: 'pred-1',
      memberName: 'Father',
      title: 'Heart Health & Cardiovascular Risk',
      type: 'Cardiovascular (Framingham AI)',
      date: '16 Sep 2026',
      score: '86/100',
      riskLevel: 'Low Risk',
      result: 'Stable Cardiovascular Telemetry (Score 86/100)',
      status: 'Reviewed',
      relatedDoctor: {
        name: 'Dr. Ananya Rao',
        role: 'Lead Cardiologist',
        department: 'Cardiology',
        hospital: 'Fortis Healthcare, Bannerghatta',
      },
      attachedDoc: {
        title: 'Lipid Profile & Cardiac Biomarkers',
        type: 'Lab Report',
        source: 'Medical Records',
      },
      factors: [
        'Resting Blood Pressure: 122/78 mmHg',
        'Total Cholesterol: 182 mg/dL',
        'Resting Heart Rate: 70 bpm',
      ],
      recommendation: 'Cardiovascular status stable. Continue regular aerobic activity and annual lipid checkups.',
    },
    {
      id: 'pred-2',
      memberName: 'Mother',
      title: 'Diabetes 3-Year Risk Forecaster',
      type: 'Metabolic (XGBoost)',
      date: '10 Sep 2026',
      score: '24%',
      riskLevel: 'Moderate Risk',
      result: 'Prediabetes Risk Zone (24%)',
      status: 'Action Required',
      relatedDoctor: {
        name: 'Dr. Kavya Shah',
        role: 'Senior Diabetologist & Endocrinologist',
        department: 'Diabetology',
        hospital: 'Manipal Hospital, Whitefield',
      },
      attachedDoc: {
        title: 'Comprehensive Metabolic Panel & HbA1c',
        type: 'Lab Report',
        source: 'Medical Records',
      },
      factors: [
        'Fasting Glucose: 112 mg/dL',
        'HbA1c: 5.9%',
        'BMI: 25.4',
      ],
      recommendation: 'Moderate metabolic risk score. Dietary carbohydrate management and repeat glucose monitoring recommended.',
    },
    {
      id: 'pred-3',
      memberName: 'Son',
      title: 'Fracture Detection Radiograph AI',
      type: 'Musculoskeletal (ResNet-50)',
      date: '04 Sep 2026',
      score: '96%',
      riskLevel: 'Low Risk',
      result: 'No Acute Fracture Identified (96% conf)',
      status: 'Completed',
      relatedDoctor: {
        name: 'Dr. Rahul Mehta',
        role: 'Chief of Orthopedics',
        department: 'Orthopedics',
        hospital: 'Apollo Hospitals, Greams Road',
      },
      attachedDoc: {
        title: 'Left Wrist AP & Lateral Radiograph',
        type: 'Imaging / X-Ray',
        source: 'Medical Records',
      },
      factors: [
        'Anatomical Site: Left Wrist',
        'Cortical Margins: Intact',
        'Joint Space: Preserved',
      ],
      recommendation: 'Radiographic examination shows no bony disruption. Continue rest and ice application as needed.',
    },
  ];

  const allHistory = [...predictionHistory, ...defaultHistory];

  const handleOpenModelInput = (modelType) => {
    setSelectedModel(modelType);
  };

  const handleRunPrediction = (predictionPayload) => {
    if (onAddPrediction) {
      onAddPrediction(predictionPayload);
    }
    if (onOpenPredictionDetail) {
      onOpenPredictionDetail(predictionPayload);
    } else {
      navigate('Personal prediction detail');
    }
    announce(`${predictionPayload.title} assessment completed.`);
  };

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Sparkles size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>AI predictions</h1>
          <p>Clinical decision-support and predictive telemetry tools for {member?.name || 'your family'}.</p>
        </div>
      </div>

      <div className="feature-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Interactive AI Models Grid */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
            Available Predictive AI Models
          </h2>
          <div className="ai-modules">
            <button
              className="ai-module"
              onClick={() => handleOpenModelInput('fracture')}
            >
              <span className="ai-icon coral-bg">
                <Activity size={18} />
              </span>
              <h3>Fracture detection</h3>
              <p>Upload an X-Ray radiograph to evaluate bone integrity with Grad-CAM heatmap localization.</p>
              <ArrowUpRight size={16} />
            </button>

            <button
              className="ai-module"
              onClick={() => handleOpenModelInput('diabetes')}
            >
              <span className="ai-icon lilac-bg">
                <Activity size={18} />
              </span>
              <h3>Diabetes risk</h3>
              <p>Enter fasting glucose, HbA1c, and BMI parameters to forecast 3-year metabolic risk.</p>
              <ArrowUpRight size={16} />
            </button>

            <button
              className="ai-module"
              onClick={() => handleOpenModelInput('heart')}
            >
              <span className="ai-icon mint-bg">
                <HeartPulse size={18} />
              </span>
              <h3>Heart disease risk</h3>
              <p>Assess cardiovascular parameters, lipid levels, and blood pressure trends.</p>
              <ArrowUpRight size={16} />
            </button>

            <button
              className="ai-module"
              onClick={() => handleOpenModelInput('general')}
            >
              <span className="ai-icon yellow-bg">
                <ShieldCheck size={18} />
              </span>
              <h3>General health risk</h3>
              <p>
                Combine family history, lifestyle factors, and symptoms into a holistic risk assessment.
              </p>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>

        {/* Prediction History Section */}
        <div>
          <div className="section-heading" style={{ margin: '0 0 12px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} style={{ color: 'var(--family-primary)' }} />
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Prediction History</h2>
            </div>
          </div>

          <div className="feature-list">
            {allHistory.map((item, idx) => (
              <article className="feature-card" key={`${item.id || item.title}-${idx}`}>
                <div className={`avatar avatar-${item.memberName === 'Mother' ? 'lilac' : item.memberName === 'Son' ? 'mint' : 'coral'}`}>
                  {item.memberName?.slice(0, 2).toUpperCase() || 'FM'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '14px' }}>{item.title}</h3>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '600',
                        backgroundColor: item.riskLevel === 'High Risk' ? '#fee2e2' : item.riskLevel === 'Moderate Risk' ? '#fef3c7' : '#dcfce7',
                        color: item.riskLevel === 'High Risk' ? '#dc2626' : item.riskLevel === 'Moderate Risk' ? '#d97706' : '#16a34a',
                      }}
                    >
                      {item.riskLevel || 'Low Risk'}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--family-muted)' }}>
                    Patient: <strong>{item.memberName}</strong> · {item.type || 'Clinical Decision Support'} · Evaluated: {item.date}
                  </p>
                  
                  {/* Linked Doctor & Attached Doc Telemetry */}
                  <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '12px', flexWrap: 'wrap' }}>
                    {item.relatedDoctor && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--family-ink)' }}>
                        <Stethoscope size={13} style={{ color: 'var(--family-primary)' }} />
                        {item.relatedDoctor.name} ({item.relatedDoctor.department})
                      </span>
                    )}
                    {item.attachedDoc && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--family-muted)' }}>
                        <FileText size={13} style={{ color: '#6366f1' }} />
                        {typeof item.attachedDoc === 'object' ? item.attachedDoc.title : item.attachedDoc}
                      </span>
                    )}
                  </div>

                  <span className="feature-meta" style={{ marginTop: '4px', display: 'block', fontSize: '12px' }}>
                    Result: {item.result}
                  </span>
                </div>

                <button
                  className="text-button"
                  onClick={() => {
                    if (onOpenPredictionDetail) {
                      onOpenPredictionDetail(item);
                    } else {
                      navigate('Personal prediction detail');
                    }
                  }}
                >
                  View details <ArrowUpRight size={14} />
                </button>
              </article>
            ))}
          </div>
        </div>

        <div className="ai-warning" style={{ margin: 0 }}>
          <ShieldCheck size={17} /> AI-assisted results support clinical decisions and are not a medical diagnosis. Consult an authorized physician for clinical evaluation.
        </div>
      </div>

      {/* Model Input Modal */}
      <PredictionInputModal
        isOpen={!!selectedModel}
        onClose={() => setSelectedModel(null)}
        modelType={selectedModel}
        member={member}
        records={records}
        onSubmitPrediction={handleRunPrediction}
        onAddRecord={onAddRecord}
        announce={announce}
      />
    </section>
  );
}
