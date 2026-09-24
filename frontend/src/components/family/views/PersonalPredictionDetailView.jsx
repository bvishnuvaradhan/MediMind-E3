import { Sparkles, ArrowUpRight, ShieldCheck, Activity, HeartPulse, CheckCircle2 } from 'lucide-react';

export function PersonalPredictionDetailView({
  prediction,
  member,
  navigate,
  announce,
}) {
  const activePred = prediction || {
    title: 'Heart Health & Cardiovascular Risk',
    score: '86/100',
    riskLevel: 'Low Risk',
    result: 'Stable Cardiovascular Status (Score 86/100)',
    date: '16 Sep 2026',
    memberName: member?.name || 'Father',
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

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon" style={{ backgroundColor: 'var(--family-primary-subtle)', color: 'var(--family-primary)' }}>
          <Sparkles size={22} />
        </span>
        <div>
          <p className="eyebrow">Personal AI Telemetry · {activePred.memberName || member?.name || 'Father'}</p>
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
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <span className={`status-badge ${activePred.riskLevel === 'High Risk' ? 'status-danger' : activePred.riskLevel === 'Moderate Risk' ? 'status-warning' : 'status-success'}`} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', backgroundColor: activePred.riskLevel === 'High Risk' ? '#fee2e2' : activePred.riskLevel === 'Moderate Risk' ? '#fef3c7' : '#dcfce7', color: activePred.riskLevel === 'High Risk' ? '#dc2626' : activePred.riskLevel === 'Moderate Risk' ? '#d97706' : '#16a34a' }}>
                {activePred.riskLevel || 'Low Risk'}
              </span>
              <button
                className="plain-button"
                onClick={() => {
                  navigate('Doctors');
                  announce('Navigating to doctor consultation booking with AI findings attached.');
                }}
                style={{ fontSize: '12px', color: 'var(--family-primary)', fontWeight: '600', cursor: 'pointer' }}
              >
                Discuss with Doctor →
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
                <span>{activePred.memberName}'s Risk Profile</span>
                <strong>{activePred.score || '14%'} (Top 15th percentile)</strong>
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

      {/* Breakdown Panels */}
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

        <div style={{ padding: '14px', backgroundColor: 'var(--family-card)', borderRadius: '10px', border: '1px solid var(--family-border)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} style={{ color: 'var(--family-primary)' }} />
            Care Team Interpretation & Next Steps
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--family-muted)', lineHeight: '1.5', margin: 0 }}>
            {activePred.recommendation} If new symptoms or changes occur, share this report directly with your authorized specialist via the Doctor Access tab.
          </p>
        </div>

        <div className="ai-warning" style={{ margin: 0 }}>
          <ShieldCheck size={16} /> MediMind AI telemetry is intended for personal health tracking and clinical decision support. It is not an automated medical diagnosis.
        </div>
      </div>
    </section>
  );
}
