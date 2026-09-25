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
} from 'lucide-react';
import { initialPresentationData } from '../../../data/medimindData';

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

  // Robustly determine matching doctor from specialty/type (solves .split crash root cause)
  const getRelatedDoctor = () => {
    let docObj = null;

    if (activePred.relatedDoctor) {
      if (typeof activePred.relatedDoctor === 'object' && activePred.relatedDoctor !== null) {
        docObj = {
          ...activePred.relatedDoctor,
          name: activePred.relatedDoctor.name || activePred.relatedDoctor.title || 'Specialist',
          title: activePred.relatedDoctor.title || activePred.relatedDoctor.name || 'Specialist',
        };
      } else if (typeof activePred.relatedDoctor === 'string') {
        const found = initialPresentationData.Doctors.find(
          (d) =>
            d.name.toLowerCase().includes(activePred.relatedDoctor.toLowerCase()) ||
            d.title.toLowerCase().includes(activePred.relatedDoctor.toLowerCase())
        );
        if (found) {
          docObj = found;
        } else {
          docObj = {
            name: activePred.relatedDoctor,
            title: activePred.relatedDoctor,
            role: 'Clinical Specialist',
            department: activePred.department || 'Specialist',
            hospital: 'MediMind Central Hospital',
            initials: activePred.relatedDoctor.split(' ').map((p) => p[0] || '').join('').slice(0, 2) || 'DR',
            tone: 'mint',
          };
        }
      }
    }

    if (docObj) return docObj;

    const titleLower = (activePred.title || '').toLowerCase();
    const typeLower = (activePred.type || '').toLowerCase();
    const deptLower = (activePred.department || '').toLowerCase();

    if (
      titleLower.includes('fracture') ||
      typeLower.includes('musculoskeletal') ||
      typeLower.includes('ortho') ||
      deptLower.includes('ortho')
    ) {
      return (
        initialPresentationData.Doctors.find((d) => d.name.includes('Rahul Mehta')) || {
          name: 'Dr. Rahul Mehta',
          title: 'Dr. Rahul Mehta',
          role: 'Chief of Orthopedics',
          department: 'Orthopedics',
          hospital: 'MediMind Central Hospital',
          initials: 'RM',
          tone: 'coral',
        }
      );
    }
    if (
      titleLower.includes('diabetes') ||
      typeLower.includes('metabolic') ||
      typeLower.includes('glucose') ||
      deptLower.includes('diabet')
    ) {
      return (
        initialPresentationData.Doctors.find((d) => d.name.includes('Kavya Shah')) || {
          name: 'Dr. Kavya Shah',
          title: 'Dr. Kavya Shah',
          role: 'Senior Diabetologist & Endocrinologist',
          department: 'Diabetology',
          hospital: 'Manipal Hospital, Whitefield',
          initials: 'KS',
          tone: 'lilac',
        }
      );
    }
    if (
      titleLower.includes('heart') ||
      titleLower.includes('cardio') ||
      typeLower.includes('cardio') ||
      deptLower.includes('cardio')
    ) {
      return (
        initialPresentationData.Doctors.find((d) => d.name.includes('Ananya Rao')) || {
          name: 'Dr. Ananya Rao',
          title: 'Dr. Ananya Rao',
          role: 'Lead Cardiologist',
          department: 'Cardiology',
          hospital: 'Fortis Healthcare, Bannerghatta',
          initials: 'AR',
          tone: 'mint',
        }
      );
    }
    return (
      initialPresentationData.Doctors.find((d) => d.name.includes('Kumar Iyer')) || {
        name: 'Dr. Kumar Iyer',
        title: 'Dr. Kumar Iyer',
        role: 'Senior Consultant - General Medicine',
        department: 'General Medicine',
        hospital: 'Apollo Hospitals, Greams Road',
        initials: 'KI',
        tone: 'coral',
      }
    );
  };

  const relatedDoctor = getRelatedDoctor();

  // Safely extract doctor short name without crash
  const doctorFullName = relatedDoctor?.name || relatedDoctor?.title || 'Specialist';
  const doctorShortName =
    typeof doctorFullName === 'string' && doctorFullName.trim().includes(' ')
      ? doctorFullName.trim().split(/\s+/).slice(1).join(' ')
      : doctorFullName;

  // Find or format attached document with safe deletion handling (Requirement 7)
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
        };
      }
      const found = records.find((r) => r.title === docInput || r.type === docInput);
      if (found) {
        return {
          ...found,
          title: found.title || found.type,
          isArchived: false,
        };
      }
      return {
        title: String(docInput),
        type: 'Medical Record / Snapshot',
        date: activePred.date || 'Recent',
        source: 'Source record removed (Archived snapshot)',
        isArchived: true,
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
        isArchived: false,
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
        isArchived: false,
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
      isArchived: false,
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
          detail: `${attachedDoc.type} · ${attachedDoc.source} · Associated with AI Telemetry`,
          department: attachedDoc.department || relatedDoctor.department,
          facility: attachedDoc.facility || relatedDoctor.hospital,
          status: attachedDoc.isArchived ? 'Archived Snapshot' : 'Verified Clinical Document',
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

  // Score display logic
  const scoreValue =
    typeof activePred.score === 'string' && activePred.score.includes('/')
      ? activePred.score.split('/')[0]
      : activePred.score || '86';

  return (
    <section className="feature-view">
      <div className="feature-heading" style={{ marginBottom: '20px' }}>
        <span
          className="feature-icon"
          style={{ backgroundColor: 'var(--family-primary-subtle)', color: 'var(--family-primary)' }}
        >
          <Sparkles size={22} />
        </span>
        <div>
          <p className="eyebrow">Personal AI Telemetry · {activePred.memberName || member?.name || 'Family Member'}</p>
          <h1>{activePred.title}</h1>
          <p>Validated clinical decision-support telemetry computed on {activePred.date || '16 Sep 2026'}.</p>
        </div>
        <button className="secondary-button compact-button" onClick={() => navigate('AI predictions')}>
          <ArrowUpRight size={16} /> Back to AI predictions
        </button>
      </div>

      {/* 1. Top Summary Banner (Refactored to completely eliminate overlap) */}
      <div className="dashboard-grid profile-summary-grid" style={{ marginBottom: '20px', marginTop: 0 }}>
        {/* Prediction Outcome Card */}
        <div className="insight-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1, minWidth: 0 }}>
            <div className="insight-icon" style={{ marginTop: '2px' }}>
              <HeartPulse size={20} />
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
                <button
                  className="plain-button"
                  onClick={handleBookWithDoctor}
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
              </div>
            </div>
          </div>

          {/* Score Index Ring (Positioned cleanly in dedicated flex column) */}
          <div className="insight-ring">
            <span>{scoreValue}</span>
            <small>index</small>
          </div>
        </div>

        {/* Population Benchmark Card */}
        <div className="activity-panel" style={{ padding: '22px 24px' }}>
          <div className="section-heading" style={{ marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 2px 0' }}>Population Benchmark Comparison</h2>
              <p style={{ fontSize: '12px', color: 'var(--family-muted)', margin: 0 }}>Relative to peer cohort (Age 45–65)</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '8px 0' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                <span>{activePred.memberName || 'Patient'}'s Risk Profile</span>
                <strong style={{ color: 'var(--family-ink)' }}>{activePred.score || '14%'} (Favorable percentile)</strong>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--family-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '85%', height: '100%', backgroundColor: '#16a34a', borderRadius: '4px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '4px' }}>
                <span>National Demographic Average</span>
                <span style={{ color: 'var(--family-muted)' }}>38% average risk</span>
              </div>
              <div style={{ height: '8px', backgroundColor: 'var(--family-border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '38%', height: '100%', backgroundColor: '#94a3b8', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
          <div className="secure-banner" style={{ marginTop: '14px', padding: '10px 12px' }}>
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
            <span>Telemetry calibrated with multi-institutional healthcare cohorts.</span>
          </div>
        </div>
      </div>

      {/* 2. Recommended Specialist & Input Evidence Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {/* Recommended Specialist Card */}
        <div className="doctor-section-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Stethoscope size={17} style={{ color: 'var(--family-primary)' }} />
              Recommended Medical Specialist
            </h3>
            <span
              style={{
                fontSize: '11px',
                background: 'var(--family-primary-subtle)',
                color: 'var(--family-primary)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: '600',
              }}
            >
              {relatedDoctor.department || 'Specialist'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px', flex: 1 }}>
            <div
              className={`avatar avatar-${relatedDoctor.tone || 'mint'}`}
              style={{ width: '48px', height: '48px', fontSize: '16px', flexShrink: 0 }}
            >
              {relatedDoctor.initials || 'DR'}
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
            <CalendarPlus size={16} /> Book Consultation with {doctorShortName}
          </button>
        </div>

        {/* Used / Uploaded Document Card */}
        <div className="doctor-section-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={17} style={{ color: '#6366f1' }} />
              Input Document & Clinical Evidence
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
              {attachedDoc.isArchived && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b91c1c', fontSize: '11.5px', marginTop: '4px' }}>
                  <AlertCircle size={13} /> Original file was deleted from records. Telemetry snapshot preserved.
                </div>
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

      {/* 3. Clinical Parameters & Guidance */}
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
            {activePred.recommendation} If new symptoms develop or existing values shift, consult {relatedDoctor.name} directly or
            request a follow-up assessment.
          </p>
        </div>

        <div className="ai-warning" style={{ margin: 0 }}>
          <ShieldCheck size={16} /> MediMind AI telemetry is intended for personal health tracking and clinical decision
          support. It is not an automated medical diagnosis.
        </div>
      </div>
    </section>
  );
}

