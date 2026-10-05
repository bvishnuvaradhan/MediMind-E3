import { useState } from 'react';
import {
  Sparkles,
  Activity,
  HeartPulse,
  ShieldCheck,
  ArrowUpRight,
  History,
  FileText,
  Stethoscope,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react';
import { matchesFamilyMember } from '../../../data/medimindData';
import { PredictionInputModal } from '../components/PredictionInputModal';

export function AiPredictionsView({
  member,
  familyMembers = [],
  records = [],
  predictionHistory = [],
  navigate,
  announce,
  onOpenPredictionDetail,
  onAddPrediction,
  onDeletePrediction,
  onAddRecord,
}) {
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('All');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [dismissedDefaultIds, setDismissedDefaultIds] = useState([]);

  const defaultHistory = [
    {
      id: 'pred-1',
      memberId: 'MEM-001-01',
      memberName: 'Rohan Kapoor',
      memberRelation: 'Father',
      title: 'Heart Health & Cardiovascular Risk',
      type: 'Cardiovascular (Framingham AI)',
      modelType: 'heart',
      date: '16 Sep 2026',
      score: '86/100',
      riskLevel: 'Low Risk',
      result: 'Stable Cardiovascular Telemetry (Score 86/100)',
      status: 'Reviewed',
      relatedDoctor: {
        name: 'Dr. Ananya Rao',
        role: 'Lead Cardiologist',
        department: 'Cardiology',
        hospital: 'MediMind Central Hospital, Bengaluru',
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
      memberId: 'MEM-001-02',
      memberName: 'Priya Kapoor',
      memberRelation: 'Mother',
      title: 'Diabetes 3-Year Risk Forecaster',
      type: 'Metabolic (XGBoost)',
      modelType: 'diabetes',
      date: '10 Sep 2026',
      score: '24%',
      riskLevel: 'Moderate Risk',
      result: 'Prediabetes Risk Zone (24%)',
      status: 'Action Required',
      relatedDoctor: {
        name: 'Dr. Kavya Shah',
        role: 'Senior Diabetologist & Endocrinologist',
        department: 'Diabetology',
        hospital: 'Apex Metro Healthcare, Hyderabad',
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
      memberId: 'MEM-001-03',
      memberName: 'Arjun Kapoor',
      memberRelation: 'Son',
      title: 'Fracture Detection Radiograph AI',
      type: 'Musculoskeletal (ResNet-18)',
      modelType: 'fracture',
      date: '04 Sep 2026',
      score: '96%',
      riskLevel: 'Low Risk',
      result: 'No Acute Fracture Identified (96% conf)',
      status: 'Completed',
      isFracture: false,
      relatedDoctor: {
        name: 'Dr. Rahul Mehta',
        role: 'Chief of Orthopedics',
        department: 'Orthopedics',
        hospital: 'MediMind Central Hospital, Bengaluru',
      },
      attachedDoc: {
        title: 'Left Wrist AP & Lateral Radiograph',
        type: 'Imaging / X-Ray',
        source: 'Medical Records',
      },
      factors: [
        'Radiographic View: Left Wrist AP',
        'Cortical Margins: Intact',
        'Joint Space: Preserved',
      ],
      recommendation: 'Radiographic examination shows no bony disruption. Continue rest and ice application as needed.',
    },
    {
      id: 'pred-4',
      memberId: 'MEM-001-04',
      memberName: 'Ananya Kapoor',
      memberRelation: 'Daughter',
      title: 'General Health Biometric Index',
      type: 'Triage & Wellness (Clinical NLP)',
      modelType: 'general',
      date: '12 Sep 2026',
      score: '92/100',
      riskLevel: 'Low Risk',
      result: 'Optimal Health Telemetry (Score 92/100)',
      status: 'Completed',
      relatedDoctor: {
        name: 'Dr. Sandeep Rao',
        role: 'Consultant Physician',
        department: 'General Medicine',
        hospital: 'MediMind Central Hospital',
      },
      attachedDoc: {
        title: 'Annual Pediatric & Adolescent Wellness Panel',
        type: 'Clinical Assessment',
        source: 'Medical Records',
      },
      factors: [
        'Blood Pressure: 110/72 mmHg',
        'Hemoglobin: 13.2 g/dL',
        'BMI: 21.0 kg/m²',
      ],
      recommendation: 'Biometrics are optimal. Routine follow-up scheduled.',
    },
  ];

  const filteredDefault = defaultHistory.filter((item) => !dismissedDefaultIds.includes(item.id));
  const allHistory = [...predictionHistory, ...filteredDefault];

  const selectedMemberObj = familyMembers.find(
    (m) => m.name === selectedMemberFilter || m.fullName === selectedMemberFilter || m.id === selectedMemberFilter
  );

  // Filter history by member
  const filteredHistory = allHistory.filter((item) => {
    if (selectedMemberFilter === 'All') return true;
    return matchesFamilyMember(item, selectedMemberObj);
  });

  const displayedHistory = showAllHistory ? filteredHistory : filteredHistory.slice(0, 3);

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

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    const targetId = itemToDelete.id || itemToDelete._id;

    if (onDeletePrediction) {
      onDeletePrediction(itemToDelete);
    }
    if (targetId && String(targetId).startsWith('pred-')) {
      setDismissedDefaultIds((prev) => [...prev, targetId]);
    }

    announce(`AI prediction "${itemToDelete.title}" removed from history.`);
    setItemToDelete(null);
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
          <p>Clinical decision-support and predictive telemetry tools for {member?.fullName || member?.name || 'your family'}.</p>
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
              <p>Upload a digital X-Ray radiograph to evaluate bone integrity with deep ResNet-18 neural networks.</p>
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
              <p>Assess cardiovascular parameters, lipid levels, and blood pressure hemodynamics.</p>
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
                Synthesize symptoms, physical habits, and family history into a comprehensive triage assessment.
              </p>
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>

        {/* Prediction History Section with Member Filter & Max-3 View All Toggle */}
        <div>
          <div className="section-heading" style={{ margin: '0 0 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} style={{ color: 'var(--family-primary)' }} />
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Prediction History</h2>
            </div>

            {/* Member Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={14} style={{ color: 'var(--family-primary)' }} />
                Member:
              </span>
              <select
                className="feature-input"
                value={selectedMemberFilter}
                onChange={(e) => {
                  setSelectedMemberFilter(e.target.value);
                  announce(e.target.value === 'All' ? 'Viewing AI prediction history for all family members.' : `Filtered AI prediction history for ${e.target.value}.`);
                }}
                style={{ padding: '6px 12px', fontSize: '13px', minWidth: '200px', fontWeight: '600' }}
              >
                <option value="All">All Family Members ({allHistory.length})</option>
                {familyMembers.map((m) => {
                  const mName = m.fullName || m.name;
                  const mRel = m.relationship || m.relation || 'Member';
                  const count = allHistory.filter((item) => matchesFamilyMember(item, m)).length;
                  return (
                    <option key={m.id || m.name} value={m.name}>
                      {mName} — {mRel} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="feature-list">
            {displayedHistory.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--family-muted)', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
                No prediction history found for {selectedMemberFilter === 'All' ? 'the selected filter' : selectedMemberFilter}.
              </div>
            ) : (
              displayedHistory.map((item, idx) => (
                <article className="feature-card" key={`${item.id || item.title}-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                  <div className={`avatar avatar-${item.memberName?.toLowerCase().includes('priya') || item.memberRelation === 'Mother' ? 'lilac' : item.memberName?.toLowerCase().includes('arjun') || item.memberRelation === 'Son' ? 'mint' : 'coral'}`}>
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
                      Patient: <strong>{item.memberName}</strong>{item.memberRelation ? ` (${item.memberRelation})` : ''} · {item.type || 'Clinical Decision Support'} · Evaluated: {item.date}
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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
                    <button
                      className="icon-button"
                      onClick={() => setItemToDelete(item)}
                      title={`Delete prediction: ${item.title}`}
                      style={{ color: '#dc2626', padding: '6px', borderRadius: '6px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* View All / Show Less Toggle if > 3 items */}
          {filteredHistory.length > 3 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
              <button
                className="secondary-button"
                onClick={() => setShowAllHistory(!showAllHistory)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}
              >
                {showAllHistory ? (
                  <>
                    Show Less (Top 3) <ChevronUp size={16} />
                  </>
                ) : (
                  <>
                    View All ({filteredHistory.length} Predictions) <ChevronDown size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="ai-warning" style={{ margin: 0 }}>
          <ShieldCheck size={17} /> AI-assisted results support clinical decision-making and are not a medical diagnosis. Consult an authorized healthcare professional.
        </div>
      </div>

      {/* Model Input Modal */}
      <PredictionInputModal
        isOpen={!!selectedModel}
        onClose={() => setSelectedModel(null)}
        modelType={selectedModel}
        member={member}
        familyMembers={familyMembers}
        records={records}
        onSubmitPrediction={handleRunPrediction}
        onAddRecord={onAddRecord}
        announce={announce}
      />

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="modal-backdrop" role="presentation" onClick={() => setItemToDelete(null)}>
          <div
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--family-border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} style={{ color: '#dc2626' }} />
                <h3 id="delete-modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                  Delete AI Prediction
                </h3>
              </div>
            </div>

            <div style={{ padding: '16px 0', fontSize: '13.5px', color: 'var(--family-ink)', lineHeight: '1.5' }}>
              Are you sure you want to delete the <strong>{itemToDelete.title}</strong> prediction for{' '}
              <strong>{itemToDelete.memberName || 'this patient'}</strong>?
              <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: 'var(--family-muted)' }}>
                This action cannot be undone. Associated medical records and original files will not be deleted.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--family-border)' }}>
              <button className="secondary-button" onClick={() => setItemToDelete(null)}>
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={handleConfirmDelete}
                style={{ backgroundColor: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
