import { Sparkles, ArrowUpRight, ShieldCheck, Activity, HeartPulse, CheckCircle2, FileText, Stethoscope, Eye, CalendarPlus } from 'lucide-react';
import { initialPresentationData } from '../../../data/familyMockData';

export function PersonalPredictionDetailView({
  prediction,
  member,
  records = [],
  navigate,
  announce,
  openFeatureModal,
  onBookDoctor,
}) {
  const activePred = prediction || {
    title: 'Heart Health & Cardiovascular Risk',
    type: 'Cardiovascular (Framingham AI)',
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
      doctor: 'Dr. Ananya Rao',
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

  // Determine matching doctor from specialty/type
  const getRelatedDoctor = () => {
    if (activePred.relatedDoctor) return activePred.relatedDoctor;
    const titleLower = (activePred.title || '').toLowerCase();
    const typeLower = (activePred.type || '').toLowerCase();

    if (titleLower.includes('fracture') || typeLower.includes('musculoskeletal') || typeLower.includes('ortho')) {
      return initialPresentationData.Doctors.find((d) => d.name.includes('Rahul Mehta')) || {
        name: 'Dr. Rahul Mehta',
        role: 'Chief of Orthopedics',
        department: 'Orthopedics',
        hospital: 'Apollo Hospitals, Greams Road',
        initials: 'RM',
        tone: 'coral',
      };
    }
    if (titleLower.includes('diabetes') || typeLower.includes('metabolic') || typeLower.includes('glucose')) {
      return initialPresentationData.Doctors.find((d) => d.name.includes('Kavya Shah')) || {
        name: 'Dr. Kavya Shah',
        role: 'Senior Diabetologist & Endocrinologist',
        department: 'Diabetology',
        hospital: 'Manipal Hospital, Whitefield',
        initials: 'KS',
        tone: 'lilac',
      };
    }
    if (titleLower.includes('heart') || titleLower.includes('cardio') || typeLower.includes('cardio')) {
      return initialPresentationData.Doctors.find((d) => d.name.includes('Ananya Rao')) || {
        name: 'Dr. Ananya Rao',
        role: 'Lead Cardiologist',
        department: 'Cardiology',
        hospital: 'Fortis Healthcare, Bannerghatta',
        initials: 'AR',
        tone: 'mint',
      };
    }
    return initialPresentationData.Doctors.find((d) => d.name.includes('Kumar Iyer')) || {
      name: 'Dr. Kumar Iyer',
      role: 'Senior Consultant - General Medicine',
      department: 'General Medicine',
      hospital: 'Apollo Hospitals, Greams Road',
      initials: 'KI',
      tone: 'coral',
    };
  };

  const relatedDoctor = getRelatedDoctor();

  // Find or format attached document
  const getAttachedDoc = () => {
    if (activePred.attachedDoc) {
      if (typeof activePred.attachedDoc === 'object') return activePred.attachedDoc;
      const found = records.find((r) => r.title === activePred.attachedDoc);
      if (found) return found;
      return {
        title: String(activePred.attachedDoc),
        type: 'Medical Record / Upload',
        date: activePred.date || 'Recent',
        source: 'Uploaded by Family',
      };
    }
    // Default fallback based on type
    const titleLower = (activePred.title || '').toLowerCase();
    if (titleLower.includes('fracture')) {
      return {
        title: 'Left Wrist AP & Lateral Radiograph',
        type: 'Imaging / X-Ray',
        date: activePred.date || '04 Sep 2026',
        source: 'Medical Records',
        doctor: 'Dr. Rahul Mehta',
        department: 'Orthopedics',
        facility: 'Apollo Imaging Center',
      };
    }
    if (titleLower.includes('diabetes')) {
      return {
        title: 'Comprehensive Metabolic Panel & HbA1c',
        type: 'Lab Report',
        date: activePred.date || '10 Sep 2026',
        source: 'Medical Records',
        doctor: 'Dr. Kavya Shah',
        department: 'Diabetology',
        facility: 'Manipal Diagnostics',
      };
    }
    return {
      title: 'Annual Lipid & Cardiovascular Panel',
      type: 'Lab Report',
      date: activePred.date || '16 Sep 2026',
      source: 'Medical Records',
      doctor: 'Dr. Ananya Rao',
      department: 'Cardiology',
      facility: 'Fortis Clinical Labs',
    };
  };

  const attachedDoc = getAttachedDoc();

  const handleOpenDocModal = () => {
    if (openFeatureModal) {
      openFeatureModal(
        {
          title: attachedDoc.title,
          doctor: attachedDoc.doctor || relatedDoctor.name,
          date: attachedDoc.date || activePred.date,
          detail: `${attachedDoc.type} · ${attachedDoc.source || 'Medical Records'} · Associated with AI Telemetry`,
          department: attachedDoc.department || relatedDoctor.department,
          facility: attachedDoc.facility || relatedDoctor.hospital,
          status: 'Verified Clinical Document',
          meta: `Patient: ${activePred.memberName || member?.name || 'Patient'}`,
        },
        'Medical record'
      );
    } else {
      announce(`Viewing details for document: ${attachedDoc.title}`);
    }
  };

  const handleBookWithDoctor = () => {
    if (onBookDoctor) {
      onBookDoctor(relatedDoctor);
    } else {
      navigate('Doctors');
    }
    announce(`Initiated consultation booking with ${relatedDoctor.name}.`);
  };

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon" style={{ backgroundColor: 'var(--family-primary-subtle)', color: 'var(--family-primary)' }}>
          <Sparkles size={22} />
        </span>
        <div>
          <p className="eyebrow">Personal AI Telemetry · {activePred.memberName || member?.name || 'Family Member'}</p>
          <h1>{activePred.title}</h1>
          <p>Validated clinical decision-support telemetry computed on {activePred.date || '16 Sep 2026'}.</p>
        </div>
        <button
          className="secondary-button compact-button"
          onClick={() => navigate('AI predictions')}
        >
          <ArrowUpRight size={16} /> Back to AI predictions
        </button>
      </div>

      {/* Top Summary Banner */}
      <div className="dashboard-grid profile-summary-grid" style={{ marginBottom: '20px' }}>
        <div className="insight-card">
          <div className="insight-icon">
            <HeartPulse size={20} />
          </div>
          <div>
            <p className="card-kicker">PREDICTION OUTCOME</p>
            <h3>{activePred.result}</h3>
            <p className="insight-copy">
              {activePred.recommendation}
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: activePred.riskLevel === 'High Risk' ? '#fee2e2' : activePred.riskLevel === 'Moderate Risk' ? '#fef3c7' : '#dcfce7',
                  color: activePred.riskLevel === 'High Risk' ? '#dc2626' : activePred.riskLevel === 'Moderate Risk' ? '#d97706' : '#16a34a',
                }}
              >
                {activePred.riskLevel || 'Low Risk'}
              </span>
              <button
                className="plain-button"
                onClick={handleBookWithDoctor}
                style={{ fontSize: '12.5px', color: 'var(--family-primary)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Discuss with Specialist →
              </button>
            </div>
          </div>
          <div className="insight-ring">
            <span>{typeof activePred.score === 'string' && activePred.score.includes('/') ? activePred.score.split('/')[0] : activePred.score || '86'}</span>
            <small>index</small>
          </div>
        </div>

        <div className="activity-panel">
          <div className="section-heading">
            <div>
              <h2>Population Benchmark Comparison</h2>
              <p>Relative to peer cohort (Age 45-65)</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '8px 0' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>{activePred.memberName || 'Patient'}'s Risk Profile</span>
                <strong>{activePred.score || '14%'} (Favorable percentile)</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--family-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', backgroundColor: '#16a34a', borderRadius: '4px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span>National Demographic Average</span>
                <span style={{ color: 'var(--family-muted)' }}>38% average risk</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--family-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '38%', height: '100%', backgroundColor: '#94a3b8', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
          <div className="secure-banner">
            <ShieldCheck size={16} />
            <span>Telemetry calibrated with validated multi-institutional healthcare cohorts.</span>
          </div>
        </div>
      </div>

      {/* Two Contextual Cards: Related Specialist & Used Document */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Related Specialist Card */}
        <div className="doctor-section-card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={17} style={{ color: 'var(--family-primary)' }} />
              Recommended Medical Specialist
            </h3>
            <span style={{ fontSize: '11px', background: 'var(--family-primary-subtle)', color: 'var(--family-primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
              {relatedDoctor.department || 'Specialist'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div className={`avatar avatar-${relatedDoctor.tone || 'mint'}`} style={{ width: '48px', height: '48px', fontSize: '16px' }}>
              {relatedDoctor.initials || relatedDoctor.name?.slice(0, 2).toUpperCase() || 'DR'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{relatedDoctor.name}</h4>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'var(--family-muted)' }}>{relatedDoctor.role}</p>
              <span style={{ fontSize: '12px', color: 'var(--family-ink)', fontWeight: '500' }}>{relatedDoctor.hospital}</span>
            </div>
          </div>
          <button
            className="primary-button"
            onClick={handleBookWithDoctor}
            style={{ width: '100%', justifyContent: 'center', gap: '8px', padding: '9px 14px', fontSize: '13px' }}
          >
            <CalendarPlus size={16} /> Book Consultation with {relatedDoctor.name.split(' ')[1] || relatedDoctor.name}
          </button>
        </div>

        {/* Used / Uploaded Document Card */}
        <div className="doctor-section-card" style={{ margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={17} style={{ color: '#6366f1' }} />
              Input Document & Clinical Evidence
            </h3>
            <span style={{ fontSize: '11px', background: '#eef2ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
              {attachedDoc.source || 'Medical Record'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--family-soft)', borderRadius: '8px', border: '1px solid var(--family-border)', marginBottom: '14px' }}>
            <FileText size={22} style={{ color: 'var(--family-primary)', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ fontSize: '13.5px', display: 'block', color: 'var(--family-ink)' }}>{attachedDoc.title}</strong>
              <span style={{ fontSize: '12px', color: 'var(--family-muted)', display: 'block', marginTop: '2px' }}>
                {attachedDoc.type} · Attached on {attachedDoc.date || activePred.date}
              </span>
              {attachedDoc.facility && (
                <span style={{ fontSize: '11.5px', color: 'var(--family-muted)', display: 'block', marginTop: '2px' }}>
                  Facility: {attachedDoc.facility}
                </span>
              )}
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
      </div>

      {/* Breakdown Panels */}
      <div className="feature-panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '10px' }}>
            Clinical Parameters & Contributing Biomarkers
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

        <div style={{ padding: '14px', backgroundColor: 'var(--family-card)', borderRadius: '10px', border: '1px solid var(--family-border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} style={{ color: 'var(--family-primary)' }} />
            Care Team Interpretation & Follow-up Guidance
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--family-muted)', lineHeight: '1.5', margin: 0 }}>
            {activePred.recommendation} If new symptoms develop or existing values shift, consult {relatedDoctor.name} directly or request a follow-up assessment.
          </p>
        </div>

        <div className="ai-warning" style={{ margin: 0 }}>
          <ShieldCheck size={16} /> MediMind AI telemetry is intended for personal health tracking and clinical decision support. It is not an automated medical diagnosis.
        </div>
      </div>
    </section>
  );
}
