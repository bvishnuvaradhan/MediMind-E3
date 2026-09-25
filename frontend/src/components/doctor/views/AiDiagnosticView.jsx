import React, { useState } from 'react';

export function AiDiagnosticView({
  patients = [],
  onOpenAiExplain,
  onOpenFullAiAnalysis,
  onOpenNewConsultation,
}) {
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('All');

  const allAiScans = patients.flatMap((p) =>
    (p.aiPredictions || []).map((pred) => ({
      ...pred,
      patientName: p.name,
      patientId: p.id,
      patientGender: p.gender,
      patientAge: p.age,
    }))
  );

  const filteredScans = allAiScans.filter((s) => {
    return selectedPatientFilter === 'All' || s.patientId === selectedPatientFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="doctor-badge doctor-badge-completed">CNN Engine Active</span>
              <span style={{ fontSize: '13px', color: 'var(--doctor-text-muted)' }}>Decision Support for Authorized Patients</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              AI Radiographic & Risk Decision Support Telemetry
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Automated computer-vision screening of plain radiographs with Grad-CAM saliency localization
            </p>
          </div>
          <div style={{ padding: '6px 12px', backgroundColor: 'var(--doctor-warning-bg)', borderRadius: '6px', fontSize: '12px', color: '#92400e', fontWeight: 700 }}>
            Clinician Decision Support Mode
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="doctor-card" style={{ padding: '16px 20px' }}>
        <div className="doctor-filter-bar" style={{ margin: 0 }}>
          <div className="doctor-filter-left">
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--doctor-text-secondary)' }}>Filter by Patient:</span>
            <select
              className="doctor-select"
              value={selectedPatientFilter}
              onChange={(e) => setSelectedPatientFilter(e.target.value)}
            >
              <option value="All">All Authorized Patients ({allAiScans.length} scans)</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.aiPredictions?.length || 0} scans)
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-muted)' }}>
            Model Engine: <strong>ResNet50-Ortho-v2.4</strong>
          </div>
        </div>
      </div>

      {/* Grid of AI Scan Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
        {filteredScans.map((scan) => (
          <div
            key={scan.id}
            className="doctor-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
              borderLeft: scan.riskLevel === 'High' ? '4px solid var(--doctor-coral)' : '4px solid var(--doctor-teal)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span className="doctor-badge doctor-badge-draft">{scan.pipeline}</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '8px 0 2px', color: 'var(--doctor-text-primary)' }}>
                    {scan.finding}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-muted)' }}>
                    Patient: <strong>{scan.patientName}</strong> ({scan.patientAge}y, {scan.patientGender}) • {scan.date}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: scan.riskLevel === 'High' ? 'var(--doctor-coral)' : 'var(--doctor-teal)' }}>
                    {scan.confidence}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)' }}>Confidence</div>
                </div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: 'var(--doctor-bg)', borderRadius: '8px', marginTop: '10px', fontSize: '12.5px', color: 'var(--doctor-text-secondary)', lineHeight: 1.4 }}>
                <strong>Explainability:</strong> {scan.explanation}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--doctor-border)', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)' }}>
                Target: <strong>{scan.targetOrgan}</strong>
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {onOpenAiExplain && (
                  <button
                    type="button"
                    className="doctor-btn doctor-btn-outline doctor-btn-sm"
                    onClick={() => onOpenAiExplain(scan, scan.patientName)}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    Summary
                  </button>
                )}
                {onOpenFullAiAnalysis && (
                  <button
                    type="button"
                    className="doctor-btn doctor-btn-primary doctor-btn-sm"
                    onClick={() => onOpenFullAiAnalysis(scan, scan.patientId, 'ai_diagnostics')}
                    style={{ fontSize: '11px', padding: '4px 8px' }}
                  >
                    View Explainability &rarr;
                  </button>
                )}
                <button
                  type="button"
                  className="doctor-btn doctor-btn-outline doctor-btn-sm"
                  onClick={() => onOpenNewConsultation(patients.find((p) => p.id === scan.patientId))}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  Consult
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AiDiagnosticView;
