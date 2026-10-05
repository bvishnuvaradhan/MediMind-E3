import { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  HeartPulse,
  CheckCircle2,
  FileText,
  Stethoscope,
  Eye,
  CalendarPlus,
  AlertCircle,
  Trash2,
  AlertTriangle,
  Image as ImageIcon,
  Heart,
  Droplets,
} from 'lucide-react';
import { getRecommendedSpecialists } from '../../../utils/specialistRanking';
import { RadialGauge, BulletChart } from '../../common/charts';

export function PersonalPredictionDetailView({
  prediction,
  member,
  records = [],
  mongoDoctors = [],
  navigate,
  announce,
  openFeatureModal,
  onBookDoctor,
  onDeletePrediction,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [fetchedDoctors, setFetchedDoctors] = useState([]);

  useEffect(() => {
    if (mongoDoctors && mongoDoctors.length > 0) return;
    let isMounted = true;
    fetch('/api/doctors')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && Array.isArray(data.data)) {
          setFetchedDoctors(data.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [mongoDoctors]);

  const effectiveDoctors = (mongoDoctors && mongoDoctors.length > 0) ? mongoDoctors : fetchedDoctors;

  const activePred = prediction || {
    id: 'pred-default',
    title: 'Heart Health & Cardiovascular Risk',
    type: 'Cardiovascular (Framingham AI)',
    modelType: 'heart',
    score: '86/100',
    riskLevel: 'Low Risk',
    result: 'Stable Cardiovascular Status (Score 86/100)',
    date: '16 Sep 2026',
    memberName: member?.name || 'Father',
    attachedDoc: {
      title: 'Lipid Profile & Cardiac Biomarkers',
      type: 'Lab Report',
      date: '15 Sep 2026',
      source: 'Medical Records',
      doctor: 'Dr. Arun Kumar',
      department: 'Cardiology',
    },
    factors: [
      'Total Serum Cholesterol: 185 mg/dL (Desirable range < 200 mg/dL)',
      'Resting Blood Pressure: 124/80 mmHg (Normal hemodynamics)',
      'Resting Heart Rate: 72 bpm (Optimal cardiac rhythm)',
      'Regular Physical Activity: 150+ min aerobic weekly baseline',
    ],
    details: {
      cholesterol: '185',
      bpSystolic: '124',
      restingHr: '72',
      smoker: 'No',
    },
    recommendation: 'Cardiovascular markers remain within target longevity benchmarks. Continue balanced diet, aerobic exercise, and routine annual lipid screening.',
  };

  const titleLower = (activePred.title || '').toLowerCase();
  const modelType =
    activePred.modelType ||
    (titleLower.includes('fracture')
      ? 'fracture'
      : titleLower.includes('diabetes')
      ? 'diabetes'
      : titleLower.includes('heart') || titleLower.includes('cardio')
      ? 'heart'
      : 'general');

  const specialistRec = getRecommendedSpecialists(activePred, effectiveDoctors);
  const { requiresSpecialist, specialists = [], reason: specialistReason } = specialistRec;
  const primaryDoctor = specialists[0] || (effectiveDoctors.length > 0 ? effectiveDoctors[0] : null);

  // Find or format attached document with safe deletion handling
  const getAttachedDoc = () => {
    if (activePred.attachedDoc || activePred.documentUsed) {
      const docInput = activePred.attachedDoc || activePred.documentUsed;
      if (typeof docInput === 'object') {
        const docTitle = docInput.title || docInput.name || 'Attached Clinical Document';
        const isStillInRecords = records.some(
          (r) =>
            r.title === docTitle ||
            r.type === docTitle ||
            (docInput.record && r.type === docInput.record.type && r.date === docInput.record.date)
        );
        return {
          title: docTitle,
          type: docInput.type || 'Medical Record / Upload',
          date: docInput.date || activePred.date || 'Recent',
          source: isStillInRecords ? (docInput.source || 'Medical Records') : 'Source record removed (Archived snapshot)',
          facility: docInput.facility || 'MediMind Clinical Archive',
          isArchived: !isStillInRecords,
          previewUrl: docInput.previewUrl || null,
        };
      }
      const found = records.find((r) => r.title === docInput || r.type === docInput);
      if (found) {
        return {
          ...found,
          title: found.title || found.type,
          isArchived: false,
          previewUrl: found.previewUrl || null,
        };
      }
      return {
        title: String(docInput),
        type: 'Medical Record / Snapshot',
        date: activePred.date || 'Recent',
        source: 'Source record removed (Archived snapshot)',
        isArchived: true,
        previewUrl: null,
      };
    }

    if (modelType === 'fracture') {
      return {
        title: 'Musculoskeletal Digital Radiograph',
        type: 'Imaging / X-Ray',
        date: activePred.date || 'Recent',
        source: 'Digital Radiograph Upload',
        doctor: 'Dr. Rahul Mehta',
        department: 'Orthopedics',
        facility: 'MediMind Central Hospital Imaging',
        isArchived: false,
        previewUrl: null,
      };
    }

    return null;
  };

  const attachedDoc = getAttachedDoc();

  const handleOpenDocModal = () => {
    if (!attachedDoc) return;
    if (openFeatureModal) {
      openFeatureModal(
        {
          title: attachedDoc.title,
          doctor: attachedDoc.doctor || primaryDoctor?.name || 'Assigned Physician',
          date: attachedDoc.date || activePred.date,
          detail: `${attachedDoc.type} · ${attachedDoc.source} · Associated with AI Telemetry`,
          department: attachedDoc.department || primaryDoctor?.department || 'Specialist Care',
          facility: attachedDoc.facility || primaryDoctor?.hospital || 'MediMind Healthcare Network',
          status: attachedDoc.isArchived ? 'Archived Snapshot' : 'Verified Clinical Document',
          meta: `Patient: ${activePred.memberName || member?.name || 'Patient'}`,
        },
        'Medical record'
      );
    } else {
      announce(`Viewing details for document: ${attachedDoc.title}`);
    }
  };

  const handleBookWithDoctor = (targetDoctor = primaryDoctor) => {
    if (onBookDoctor && targetDoctor) {
      onBookDoctor(targetDoctor);
    } else {
      navigate('Doctors');
    }
    announce(`Initiated consultation booking${targetDoctor?.name ? ` with ${targetDoctor.name}` : ''}.`);
  };

  const handleDeleteCurrent = () => {
    if (onDeletePrediction) {
      onDeletePrediction(activePred);
    } else {
      announce('AI prediction deleted.');
      navigate('AI predictions');
    }
  };

  // Score display logic
  const scoreValue =
    typeof activePred.score === 'string' && activePred.score.includes('/')
      ? activePred.score.split('/')[0]
      : activePred.score || '86';

  const isEmergency = activePred.isEmergency || activePred.urgency === 'IMMEDIATE_EMERGENCY_EVALUATION';

  return (
    <section className="feature-view">
      {/* Top Header with Back and Delete actions */}
      <div className="feature-heading" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <span
            className="feature-icon"
            style={{
              backgroundColor: isEmergency ? '#fee2e2' : 'var(--family-primary-subtle)',
              color: isEmergency ? '#dc2626' : 'var(--family-primary)',
            }}
          >
            {isEmergency ? <AlertTriangle size={22} /> : <Sparkles size={22} />}
          </span>
          <div>
            <p className="eyebrow">Personal AI Telemetry · {activePred.memberName || member?.name || 'Family Member'}</p>
            <h1>{activePred.title}</h1>
            <p>Validated clinical decision-support telemetry computed on {activePred.date || 'Recent'}.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="secondary-button compact-button"
            onClick={() => setShowDeleteConfirm(true)}
            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            title="Delete this AI prediction"
          >
            <Trash2 size={15} /> Delete Prediction
          </button>
          <button className="secondary-button compact-button" onClick={() => navigate('AI predictions')}>
            <ArrowUpRight size={16} /> Back to AI predictions
          </button>
        </div>
      </div>

      {/* Emergency Alert Banner for Acute Dangerous Symptoms */}
      {isEmergency && (
        <div
          style={{
            marginBottom: '20px',
            padding: '16px 20px',
            backgroundColor: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          <AlertCircle size={24} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '800', color: '#991b1b' }}>
              CRITICAL CLINICAL NOTICE: IMMEDIATE EMERGENCY MEDICAL EVALUATION REQUIRED
            </h3>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#b91c1c', lineHeight: '1.5' }}>
              Acute red-flag cardiopulmonary/neurological symptoms detected (e.g. severe chest pain, acute dyspnea, diaphoresis, presyncope).
              Please call emergency services (dial 108/112) or proceed to the nearest emergency department immediately.
            </p>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#991b1b' }}>
              Outpatient appointment booking is NOT a substitute for urgent clinical emergency intervention.
            </span>
          </div>
        </div>
      )}

      {/* 1. Top Summary Banner */}
      <div className="dashboard-grid profile-summary-grid" style={{ marginBottom: '20px', marginTop: 0 }}>
        {/* Prediction Outcome Card */}
        <div className="insight-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
            <div className="insight-icon" style={{ marginTop: '2px' }}>
              {modelType === 'heart' ? (
                <Heart size={20} />
              ) : modelType === 'diabetes' ? (
                <Droplets size={20} />
              ) : modelType === 'fracture' ? (
                <Activity size={20} />
              ) : (
                <HeartPulse size={20} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="card-kicker">PREDICTION OUTCOME</p>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', lineHeight: '1.4' }}>{activePred.result}</h3>
              <p className="insight-copy" style={{ margin: '0 0 12px 0', fontSize: '13px', lineHeight: '1.5' }}>
                {activePred.recommendation}
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor:
                      activePred.riskLevel === 'High Risk'
                        ? '#fee2e2'
                        : activePred.riskLevel === 'Moderate Risk'
                        ? '#fef3c7'
                        : '#dcfce7',
                    color:
                      activePred.riskLevel === 'High Risk'
                        ? '#dc2626'
                        : activePred.riskLevel === 'Moderate Risk'
                        ? '#d97706'
                        : '#16a34a',
                  }}
                >
                  {activePred.riskLevel || 'Low Risk'}
                </span>
                {requiresSpecialist && (
                  <button
                    className="plain-button"
                    onClick={() => handleBookWithDoctor(primaryDoctor)}
                    style={{
                      fontSize: '12.5px',
                      color: 'var(--family-primary)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Discuss with Specialist →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Score Index Radial Gauge */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <RadialGauge
              value={parseFloat(scoreValue) || (activePred.riskLevel === 'High Risk' ? 94 : activePred.riskLevel === 'Moderate Risk' ? 52 : 88)}
              min={0}
              max={100}
              unit={typeof activePred.score === 'string' && activePred.score.includes('%') ? '%' : '/100'}
              label={modelType === 'fracture' ? 'Confidence' : (typeof activePred.score === 'string' && activePred.score.includes('/100') ? 'Health Score' : 'Risk')}
              size={120}
              color={activePred.riskLevel === 'High Risk' ? '#dc2626' : activePred.riskLevel === 'Moderate Risk' ? '#d97706' : '#16a34a'}
            />
          </div>
        </div>

        {/* Population Benchmark Card (Shown for Heart & Diabetes, or general cohort) */}
        {modelType !== 'fracture' && (
          <div className="activity-panel" style={{ padding: '22px 24px' }}>
            <div className="section-heading" style={{ marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0' }}>Population Benchmark Comparison</h2>
                <p style={{ fontSize: '12px', color: 'var(--family-muted)', margin: 0 }}>
                  Relative to validated clinical cohorts (Age 45–65)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '8px 0' }}>
              <BulletChart
                title={`${activePred.memberName || 'Patient'}'s Estimated Risk`}
                subtitle="Lower score indicates favorable risk"
                actual={parseFloat(activePred.score) || (activePred.riskLevel === 'High Risk' ? 85 : activePred.riskLevel === 'Moderate Risk' ? 45 : 12)}
                target={35}
                max={100}
                unit="%"
                ranges={[25, 50, 100]}
                color={activePred.riskLevel === 'High Risk' ? '#dc2626' : activePred.riskLevel === 'Moderate Risk' ? '#d97706' : '#16a34a'}
              />
            </div>

            <div className="secure-banner" style={{ marginTop: '14px', padding: '10px 12px' }}>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span>Calibrated against validated multi-institutional healthcare clinical datasets.</span>
            </div>
          </div>
        )}

        {/* For Fracture: Radiograph Summary Header */}
        {modelType === 'fracture' && (
          <div className="activity-panel" style={{ padding: '22px 24px' }}>
            <div className="section-heading" style={{ marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0' }}>Radiograph AI Inspection Engine</h2>
                <p style={{ fontSize: '12px', color: 'var(--family-muted)', margin: 0 }}>
                  ResNet-18 Deep Neural Network · FracAtlas + MURA Calibrated (Threshold: 0.18)
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', backgroundColor: 'var(--family-soft)', borderRadius: '8px' }}>
              <ImageIcon size={28} style={{ color: 'var(--family-primary)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--family-ink)' }}>
                  {activePred.isFracture ? 'Positive Radiographic Indicator' : 'Intact Cortical Margins'}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'block', marginTop: '2px' }}>
                  Model Output Probability: {activePred.probability || (activePred.isFracture ? '0.94' : '0.04')} (Calibrated Decision Threshold: 0.18)
                </span>
              </div>
            </div>

            <div className="secure-banner" style={{ marginTop: '14px', padding: '10px 12px' }}>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span>Radiographic feature extraction evaluates bone cortical continuity without pain bias.</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. MODULE-SPECIFIC ANALYSIS BREAKDOWN */}

      {/* A. HEART DISEASE SPECIFIC BREAKDOWN */}
      {modelType === 'heart' && (
        <div className="activity-panel" style={{ padding: '20px 24px', marginBottom: '20px' }}>
          <div className="section-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0' }}>Cardiovascular Hemodynamic & Lipid Factors</h2>
              <p style={{ fontSize: '12px', color: 'var(--family-muted)', margin: 0 }}>Input parameter calibration & Framingham risk weightings</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'block' }}>Total Serum Cholesterol</span>
              <strong style={{ fontSize: '16px', color: 'var(--family-ink)', display: 'block', margin: '4px 0' }}>
                {activePred.details?.cholesterol || 190} mg/dL
              </strong>
              <span style={{ fontSize: '11.5px', color: parseFloat(activePred.details?.cholesterol) >= 240 ? '#dc2626' : parseFloat(activePred.details?.cholesterol) >= 200 ? '#d97706' : '#16a34a' }}>
                {parseFloat(activePred.details?.cholesterol) >= 240 ? 'High (>240 mg/dL)' : parseFloat(activePred.details?.cholesterol) >= 200 ? 'Borderline (200–239)' : 'Desirable (<200 mg/dL)'}
              </span>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'block' }}>Systolic Blood Pressure</span>
              <strong style={{ fontSize: '16px', color: 'var(--family-ink)', display: 'block', margin: '4px 0' }}>
                {activePred.details?.bpSystolic || 125} mmHg
              </strong>
              <span style={{ fontSize: '11.5px', color: parseFloat(activePred.details?.bpSystolic) >= 140 ? '#dc2626' : parseFloat(activePred.details?.bpSystolic) >= 130 ? '#d97706' : '#16a34a' }}>
                {parseFloat(activePred.details?.bpSystolic) >= 140 ? 'Stage 2 HTN (≥140)' : parseFloat(activePred.details?.bpSystolic) >= 130 ? 'Stage 1 HTN (130–139)' : 'Normal (<120 mmHg)'}
              </span>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'block' }}>Resting Heart Rate</span>
              <strong style={{ fontSize: '16px', color: 'var(--family-ink)', display: 'block', margin: '4px 0' }}>
                {activePred.details?.restingHr || 72} bpm
              </strong>
              <span style={{ fontSize: '11.5px', color: '#16a34a' }}>Normal Sinus Rhythm (60–100 bpm)</span>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'block' }}>Active Tobacco Exposure</span>
              <strong style={{ fontSize: '16px', color: 'var(--family-ink)', display: 'block', margin: '4px 0' }}>
                {activePred.details?.smoker === 'Yes' ? 'Active Smoker' : 'Non-Smoker'}
              </strong>
              <span style={{ fontSize: '11.5px', color: activePred.details?.smoker === 'Yes' ? '#dc2626' : '#16a34a' }}>
                {activePred.details?.smoker === 'Yes' ? 'Vascular Risk Multiplier' : 'Zero Active Tobacco Risk'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* B. DIABETES SPECIFIC BREAKDOWN */}
      {modelType === 'diabetes' && (
        <div className="activity-panel" style={{ padding: '20px 24px', marginBottom: '20px' }}>
          <div className="section-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0' }}>Metabolic & Glycemic Indicator Panel</h2>
              <p style={{ fontSize: '12px', color: 'var(--family-muted)', margin: 0 }}>Input biomarker parameters & 3-year type-2 diabetes risk calibration</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'block' }}>Fasting Blood Glucose</span>
              <strong style={{ fontSize: '16px', color: 'var(--family-ink)', display: 'block', margin: '4px 0' }}>
                {activePred.details?.glucose || 110} mg/dL
              </strong>
              <span style={{ fontSize: '11.5px', color: parseFloat(activePred.details?.glucose) >= 126 ? '#dc2626' : parseFloat(activePred.details?.glucose) >= 100 ? '#d97706' : '#16a34a' }}>
                {parseFloat(activePred.details?.glucose) >= 126 ? 'Diabetic Range (≥126)' : parseFloat(activePred.details?.glucose) >= 100 ? 'Impaired Fasting (100–125)' : 'Normal (<100 mg/dL)'}
              </span>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'block' }}>HbA1c Glycated Hemoglobin</span>
              <strong style={{ fontSize: '16px', color: 'var(--family-ink)', display: 'block', margin: '4px 0' }}>
                {activePred.details?.hba1c || 5.7}%
              </strong>
              <span style={{ fontSize: '11.5px', color: parseFloat(activePred.details?.hba1c) >= 6.5 ? '#dc2626' : parseFloat(activePred.details?.hba1c) >= 5.7 ? '#d97706' : '#16a34a' }}>
                {parseFloat(activePred.details?.hba1c) >= 6.5 ? 'Diabetic (≥6.5%)' : parseFloat(activePred.details?.hba1c) >= 5.7 ? 'Prediabetes (5.7–6.4%)' : 'Optimal (<5.7%)'}
              </span>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'block' }}>Body Mass Index (BMI)</span>
              <strong style={{ fontSize: '16px', color: 'var(--family-ink)', display: 'block', margin: '4px 0' }}>
                {activePred.details?.bmi || 24.5} kg/m²
              </strong>
              <span style={{ fontSize: '11.5px', color: parseFloat(activePred.details?.bmi) >= 30 ? '#dc2626' : parseFloat(activePred.details?.bmi) >= 25 ? '#d97706' : '#16a34a' }}>
                {parseFloat(activePred.details?.bmi) >= 30 ? 'Obese (≥30)' : parseFloat(activePred.details?.bmi) >= 25 ? 'Overweight (25–29.9)' : 'Healthy Weight (18.5–24.9)'}
              </span>
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'block' }}>Systolic Blood Pressure</span>
              <strong style={{ fontSize: '16px', color: 'var(--family-ink)', display: 'block', margin: '4px 0' }}>
                {activePred.details?.bpSystolic || 120} mmHg
              </strong>
              <span style={{ fontSize: '11.5px', color: '#16a34a' }}>Hemodynamic Baseline</span>
            </div>
          </div>
        </div>
      )}

      {/* C. FRACTURE SPECIFIC BREAKDOWN */}
      {modelType === 'fracture' && (
        <div className="activity-panel" style={{ padding: '20px 24px', marginBottom: '20px' }}>
          <div className="section-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0' }}>Musculoskeletal Radiographic Findings</h2>
              <p style={{ fontSize: '12px', color: 'var(--family-muted)', margin: 0 }}>Cortical margin and trabecular feature analysis</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Image Preview Thumbnail if available */}
            {attachedDoc?.previewUrl && (
              <div style={{ padding: '12px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img
                  src={attachedDoc.previewUrl}
                  alt="Radiograph Preview"
                  style={{ maxHeight: '180px', width: 'auto', objectFit: 'contain', borderRadius: '6px' }}
                />
                <span style={{ fontSize: '11.5px', color: 'var(--family-muted)', marginTop: '8px' }}>
                  Analyzed Digital Radiograph
                </span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
                <strong style={{ fontSize: '13px', color: 'var(--family-ink)', display: 'block' }}>Cortical Margin Integrity</strong>
                <span style={{ fontSize: '12.5px', color: activePred.isFracture ? '#dc2626' : '#16a34a' }}>
                  {activePred.isFracture ? 'Disruption & linear cortical discontinuity identified on image analysis' : 'Intact, smooth, and continuous cortical margins on radiograph'}
                </span>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
                <strong style={{ fontSize: '13px', color: 'var(--family-ink)', display: 'block' }}>Joint Space & Trabecular Architecture</strong>
                <span style={{ fontSize: '12.5px', color: activePred.isFracture ? '#dc2626' : '#16a34a' }}>
                  {activePred.isFracture ? 'Trabecular impaction and micro-fissure line detected' : 'Preserved anatomical joint spacing with uniform trabeculae'}
                </span>
              </div>

              <div style={{ padding: '12px 14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
                <strong style={{ fontSize: '13px', color: 'var(--family-ink)', display: 'block' }}>Decision Threshold Calibration</strong>
                <span style={{ fontSize: '12.5px', color: 'var(--family-muted)' }}>
                  Calibrated Decision Threshold = 0.18 (Optimized for 96.26% Sensitivity and 98.77% Negative Predictive Value)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* D. GENERAL HEALTH SPECIFIC BREAKDOWN */}
      {modelType === 'general' && (
        <div className="activity-panel" style={{ padding: '20px 24px', marginBottom: '20px' }}>
          <div className="section-heading" style={{ marginBottom: '14px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0' }}>Clinical NLP Tri-Pillar Triage Synthesis</h2>
              <p style={{ fontSize: '12px', color: 'var(--family-muted)', margin: 0 }}>Integrated evaluation of symptoms, lifestyle, and family predispositions</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
              <strong style={{ fontSize: '13px', color: 'var(--family-ink)', display: 'block', marginBottom: '6px' }}>
                Pillar 1: Reported Symptoms & Observations
              </strong>
              <p style={{ fontSize: '12.5px', color: 'var(--family-muted)', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                {activePred.details?.symptoms || 'None specified'}
              </p>
              {activePred.extractedPositiveSymptoms && activePred.extractedPositiveSymptoms.length > 0 && (
                <div style={{ fontSize: '11.5px', color: isEmergency ? '#dc2626' : '#d97706', marginTop: '4px' }}>
                  <strong>Extracted Entities:</strong> {activePred.extractedPositiveSymptoms.join(', ')}
                </div>
              )}
              {activePred.extractedNegatedSymptoms && activePred.extractedNegatedSymptoms.length > 0 && (
                <div style={{ fontSize: '11.5px', color: '#16a34a', marginTop: '4px' }}>
                  <strong>Ruled-out / Negated:</strong> {activePred.extractedNegatedSymptoms.slice(0, 3).join(', ')}
                </div>
              )}
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
              <strong style={{ fontSize: '13px', color: 'var(--family-ink)', display: 'block', marginBottom: '6px' }}>
                Pillar 2: Lifestyle & Physical Habits
              </strong>
              <p style={{ fontSize: '12.5px', color: 'var(--family-muted)', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                {activePred.details?.lifestyle || 'Standard baseline'}
              </p>
              {activePred.detectedLifestyleFactors && activePred.detectedLifestyleFactors.length > 0 && (
                <div style={{ fontSize: '11.5px', color: 'var(--family-ink)', marginTop: '4px' }}>
                  <strong>Identified Patterns:</strong> {activePred.detectedLifestyleFactors.join(' · ')}
                </div>
              )}
            </div>

            <div style={{ padding: '14px', backgroundColor: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
              <strong style={{ fontSize: '13px', color: 'var(--family-ink)', display: 'block', marginBottom: '6px' }}>
                Pillar 3: Familial Health History
              </strong>
              <p style={{ fontSize: '12.5px', color: 'var(--family-muted)', margin: '0 0 6px 0', lineHeight: '1.4' }}>
                {activePred.details?.familyHistory || 'No significant genetic risks'}
              </p>
              {activePred.detectedFamilyFactors && activePred.detectedFamilyFactors.length > 0 && (
                <div style={{ fontSize: '11.5px', color: 'var(--family-ink)', marginTop: '4px' }}>
                  <strong>Family Factors:</strong> {activePred.detectedFamilyFactors.join(' · ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Specialist Recommendation Section */}
      <div style={{ marginBottom: '20px' }}>
        {!requiresSpecialist ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Low Risk / Intact Margins - No Specialist Required Card */}
            <div
              className="doctor-section-card"
              style={{
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f0fdf4',
                borderColor: '#bbf7d0',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <CheckCircle2 size={24} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#15803d' }}>
                      No Specialist Recommendation Required
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: '700',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                      }}
                    >
                      Baseline Stable
                    </span>
                  </div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#166534', lineHeight: '1.5' }}>
                    {specialistReason || 'Biometric and radiographic evaluation indicates intact baseline parameters without acute pathology. Specialist consultation is not clinically indicated.'}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#15803d' }}>
                    <ShieldCheck size={15} />
                    <span>Parameters are within normal baseline. Routine wellness monitoring recommended.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Document Card (if document attached) */}
            {attachedDoc && (
              <div className="doctor-section-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={17} style={{ color: '#6366f1' }} />
                    Associated Clinical Document
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      background: attachedDoc.isArchived ? '#fee2e2' : '#eef2ff',
                      color: attachedDoc.isArchived ? '#dc2626' : '#4f46e5',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontWeight: '600',
                    }}
                  >
                    {attachedDoc.source}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px',
                    background: 'var(--family-soft)',
                    borderRadius: '8px',
                    border: '1px solid var(--family-border)',
                    marginBottom: '14px',
                    flex: 1,
                  }}
                >
                  <FileText size={22} style={{ color: 'var(--family-primary)', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--family-ink)' }}>{attachedDoc.title}</strong>
                    <span style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'block', marginTop: '2px' }}>
                      {attachedDoc.type} · Attached on {attachedDoc.date}
                    </span>
                  </div>
                </div>
                <button
                  className="secondary-button"
                  onClick={handleOpenDocModal}
                  style={{ width: '100%', justifyContent: 'center', gap: '8px', padding: '9px 14px', fontSize: '13px' }}
                >
                  <Eye size={16} /> View Record Details
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="activity-panel" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Stethoscope size={19} style={{ color: 'var(--family-primary)' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                    Recommended Medical Specialists ({specialists.length} Ranked Doctors)
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: '11.5px',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    backgroundColor: activePred.riskLevel === 'High Risk' ? '#fee2e2' : '#dbeafe',
                    color: activePred.riskLevel === 'High Risk' ? '#dc2626' : '#1d4ed8',
                  }}
                >
                  {activePred.riskLevel === 'High Risk' ? 'Priority Clinical Match' : 'Balanced Experience & Cost Match'}
                </span>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--family-muted)', margin: '0 0 16px 0' }}>
                {specialistReason}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '14px',
                }}
              >
                {specialists.map((doc, idx) => (
                  <div
                    key={doc.id || doc.name || idx}
                    className="doctor-section-card"
                    style={{
                      margin: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--family-border)',
                      borderRadius: '10px',
                      padding: '16px',
                      backgroundColor: 'var(--family-soft)',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: doc.rankingBadgeTone === 'coral' ? '#fee2e2' : '#dcfce7',
                            color: doc.rankingBadgeTone === 'coral' ? '#b91c1c' : '#15803d',
                          }}
                        >
                          #{idx + 1} · {doc.rankingReason}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-primary)' }}>
                          ₹{doc.consultationFee || 750}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div
                          className={`avatar avatar-${doc.tone || (idx === 0 ? 'coral' : idx === 1 ? 'mint' : 'lilac')}`}
                          style={{ width: '44px', height: '44px', fontSize: '15px', flexShrink: 0 }}
                        >
                          {doc.initials || doc.name?.split(' ').map((p) => p[0] || '').join('').slice(0, 2) || 'DR'}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700' }}>{doc.name}</h4>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--family-muted)' }}>
                            {doc.specialization || doc.role}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--family-muted)', marginBottom: '14px' }}>
                        <div><strong>Hospital / Location:</strong> {doc.hospitalLocation || (doc.city ? `${doc.hospital}, ${doc.city}` : doc.hospital)}</div>
                        <div><strong>Experience:</strong> {doc.experience}</div>
                        <div><strong>Rating:</strong> ★ {doc.rating || 4.8} / 5.0</div>
                      </div>
                    </div>

                    <button
                      className="primary-button"
                      onClick={() => handleBookWithDoctor(doc)}
                      style={{ width: '100%', justifyContent: 'center', gap: '6px', padding: '8px 12px', fontSize: '12.5px' }}
                    >
                      <CalendarPlus size={15} /> Book with {doc.name?.split(' ')[1] || doc.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Contributing Factors & Clinical Disclaimer */}
      <div className="feature-panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>
            Clinical Parameters & Contributing Factors
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {activePred.factors?.map((factor, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  backgroundColor: 'var(--family-soft)',
                  borderRadius: '8px',
                  border: '1px solid var(--family-border)',
                }}
              >
                <CheckCircle2 size={16} style={{ color: 'var(--family-primary)', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: 'var(--family-ink)', lineHeight: '1.4' }}>{factor}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--family-card)',
            borderRadius: '10px',
            border: '1px solid var(--family-border)',
          }}
        >
          <h3
            style={{
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Activity size={16} style={{ color: 'var(--family-primary)' }} />
            Care Team Interpretation & Follow-up Guidance
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--family-muted)', lineHeight: '1.5', margin: 0 }}>
            {activePred.recommendation} If new symptoms develop or existing values shift, consult {primaryDoctor?.name || 'your healthcare provider'} directly or
            request a follow-up assessment.
          </p>
        </div>

        <div className="ai-warning" style={{ margin: 0 }}>
          <ShieldCheck size={16} /> MediMind AI decision support is calibrated for clinical screening and informational guidance.
          It does not replace professional medical evaluation, laboratory diagnosis, or clinical in-person consultation.
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-pred-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header" style={{ borderBottom: '1px solid var(--family-border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trash2 size={18} style={{ color: '#dc2626' }} />
                <h3 id="delete-pred-title" style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                  Delete AI Prediction
                </h3>
              </div>
            </div>

            <div style={{ padding: '16px 0', fontSize: '13.5px', color: 'var(--family-ink)', lineHeight: '1.5' }}>
              Are you sure you want to delete this <strong>{activePred.title}</strong> prediction for{' '}
              <strong>{activePred.memberName || member?.name || 'this patient'}</strong>?
              <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: 'var(--family-muted)' }}>
                This will remove the prediction record from your history. Any original medical record files or lab documents will be preserved.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--family-border)' }}>
              <button className="secondary-button" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={handleDeleteCurrent}
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
