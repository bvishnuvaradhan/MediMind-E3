import React from 'react';

export function AiExplainabilityView({
  prediction,
  patient,
  onBack,
  onOpenNewConsultation,
}) {
  if (!prediction) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="doctor-card" style={{ padding: '36px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📊</div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: 'var(--doctor-text-primary)' }}>
            Full AI Analysis Unavailable
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--doctor-text-muted)', maxWidth: '480px', marginInline: 'auto' }}>
            Full AI analysis is not available for this appointment or record. No deep computer-vision inference scan is currently attached.
          </p>
          <button className="doctor-btn doctor-btn-primary" onClick={onBack} style={{ margin: '0 auto' }}>
            ← Return to Previous View
          </button>
        </div>
      </div>
    );
  }

  const patientName = patient?.name || prediction.patientName || 'Authorized Patient';
  const patientAge = patient?.age || prediction.patientAge;
  const patientGender = patient?.gender || prediction.patientGender;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <button
                type="button"
                className="doctor-btn doctor-btn-outline doctor-btn-sm"
                onClick={onBack}
                style={{ fontSize: '12px', padding: '4px 10px' }}
              >
                ← Back
              </button>
              <span className="doctor-badge doctor-badge-draft">{prediction.pipeline || 'Deep Radiographic AI'}</span>
              <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                Model Engine: <strong>{prediction.modelEngine || 'ResNet50-Ortho-v2.4'}</strong>
              </span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              AI Explainability & Deep Clinical Analysis
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Authorized Patient: <strong>{patientName}</strong> {patientAge ? `(${patientAge} yrs, ${patientGender || ''})` : ''} • Inference Date: <strong>{prediction.date || '24 Sep 2026'}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {patient && onOpenNewConsultation && (
              <button
                type="button"
                className="doctor-btn doctor-btn-primary"
                onClick={() => onOpenNewConsultation(patient)}
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Start Consultation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Finding Card */}
        <div
          className="doctor-card"
          style={{
            borderLeft: prediction.riskLevel === 'High' ? '4px solid var(--doctor-coral)' : '4px solid var(--doctor-teal)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: prediction.riskLevel === 'High' ? 'var(--doctor-coral)' : 'var(--doctor-teal)',
                  }}
                >
                  Model Diagnostic Classification
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0 4px', color: 'var(--doctor-text-primary)' }}>
                  {prediction.finding}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 800,
                    color: prediction.riskLevel === 'High' ? 'var(--doctor-coral)' : 'var(--doctor-teal)',
                    lineHeight: 1,
                  }}
                >
                  {prediction.confidence}%
                </div>
                <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)', fontWeight: 600, marginTop: '2px' }}>
                  Model Confidence
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--doctor-bg)', borderRadius: '8px', border: '1px solid var(--doctor-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Target Anatomical Region
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--doctor-text-primary)', marginTop: '2px' }}>
                  {prediction.targetOrgan || 'Right Knee & Distal Femur'}
                </div>
              </div>

              <div style={{ padding: '10px 14px', backgroundColor: 'var(--doctor-bg)', borderRadius: '8px', border: '1px solid var(--doctor-border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Triage Risk Classification
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className={`doctor-badge ${prediction.riskLevel === 'High' ? 'doctor-badge-off' : 'doctor-badge-active'}`}>
                    ● {prediction.riskLevel || 'Moderate'} Risk Severity
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                    {prediction.riskLevel === 'High' ? 'Requires expedited clinical review' : 'Routine advisory screening'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', borderTop: '1px solid var(--doctor-border)', paddingTop: '10px' }}>
            Inference ID: <code style={{ fontFamily: 'monospace' }}>{prediction.id}</code>
          </div>
        </div>

        {/* Grad-CAM Heatmap Visualization Section */}
        <div className="doctor-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
              Grad-CAM Saliency & Heatmap Localization
            </h3>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--doctor-text-muted)' }}>
              Gradient-weighted Class Activation Mapping of convolutional feature layers
            </p>
          </div>

          {prediction.realGradCamUrl ? (
            <div style={{ border: '1px solid var(--doctor-border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--doctor-bg)', borderBottom: '1px solid var(--doctor-border)', fontSize: '12.5px', fontWeight: 600 }}>
                Heatmap Attention Overlay: {prediction.targetOrgan}
              </div>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', backgroundColor: '#0f172a' }}>
                <img
                  src={prediction.realGradCamUrl}
                  alt={`Grad-CAM heatmap for ${prediction.targetOrgan}`}
                  style={{ maxHeight: '280px', width: 'auto', borderRadius: '8px', objectFit: 'contain' }}
                />
              </div>
            </div>
          ) : (
            /* Neutral un-fabricated state */
            <div
              style={{
                padding: '20px',
                backgroundColor: 'var(--doctor-bg)',
                border: '1px solid var(--doctor-border)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--doctor-card)',
                  border: '1px solid var(--doctor-border)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '18px',
                  flexShrink: 0,
                }}
              >
                📊
              </div>
              <div>
                <strong style={{ fontSize: '13.5px', color: 'var(--doctor-text-primary)' }}>
                  Grad-CAM visualization unavailable
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--doctor-text-muted)', lineHeight: 1.5 }}>
                  Visual pixel-level heatmap image asset is not provided for this scan record. Advisory diagnostic attention localization is documented via textual saliency telemetry below.
                </p>
              </div>
            </div>
          )}

          {prediction.heatmapRegion && (
            <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-secondary)' }}>
              <strong>Primary Activation Cluster:</strong> {prediction.heatmapRegion}
            </div>
          )}
        </div>
      </div>

      {/* Saliency / Model Explanation Card */}
      <div className="doctor-card">
        <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
          Model Explanation & Advisory Saliency Telemetry
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '13.5px',
            color: 'var(--doctor-text-secondary)',
            lineHeight: 1.6,
            backgroundColor: 'var(--doctor-bg)',
            padding: '14px 18px',
            borderRadius: '10px',
            border: '1px solid var(--doctor-border)',
          }}
        >
          {prediction.explanation || 'No specific algorithmic commentary provided by the model engine.'}
        </p>
      </div>

      {/* Strict Human-in-the-Loop Clinical Mandate */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: 'var(--doctor-warning-bg)',
          borderRadius: '10px',
          borderLeft: '4px solid var(--doctor-warning)',
          fontSize: '12.5px',
          color: '#78350f',
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '16px' }}>🛡️</span>
        <div>
          <strong>Human-in-the-Loop Clinical Mandate:</strong> This AI feature provides advisory diagnostic decision support. It does not replace comprehensive clinical examination, patient history, or certified radiologist sign-off.
        </div>
      </div>
    </div>
  );
}

export default AiExplainabilityView;
