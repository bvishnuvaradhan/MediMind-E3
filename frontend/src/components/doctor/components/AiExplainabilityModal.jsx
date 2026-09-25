import React, { useEffect } from 'react';

export function AiExplainabilityModal({ isOpen, onClose, prediction, patientName }) {
  // Lock background scroll when modal is open and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !prediction) return null;

  return (
    <div className="doctor-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="ai-modal-title">
      <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="doctor-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="doctor-badge doctor-badge-draft">{prediction.pipeline || 'Deep Radiographic AI'}</span>
              <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                Model: <strong>{prediction.modelEngine || 'ResNet50-Ortho-v2.4'}</strong>
              </span>
            </div>
            <h3 id="ai-modal-title" className="doctor-modal-title" style={{ marginTop: '4px' }}>
              AI Clinical Decision Support & Explainability
            </h3>
            <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-muted)' }}>
              Authorized Patient: <strong>{patientName}</strong> • Inference Date: <strong>{prediction.date}</strong>
            </div>
          </div>
          <button className="doctor-btn-icon" onClick={onClose} aria-label="Close decision support modal">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="doctor-modal-body" tabIndex={0} style={{ outline: 'none' }}>
          {/* Finding summary pill */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: prediction.riskLevel === 'High' ? 'var(--doctor-soft-coral)' : 'var(--doctor-soft-teal)',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11.5px',
                  color: prediction.riskLevel === 'High' ? 'var(--doctor-coral)' : 'var(--doctor-teal)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                AI Diagnostic Telemetry Finding
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--doctor-text-primary)', marginTop: '2px' }}>
                {prediction.finding}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
                Target Anatomical Region: <strong>{prediction.targetOrgan || 'Right Knee & Distal Femur'}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: prediction.riskLevel === 'High' ? 'var(--doctor-coral)' : 'var(--doctor-teal)',
                }}
              >
                {prediction.confidence}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)', fontWeight: 600 }}>
                Model Confidence
              </div>
            </div>
          </div>

          {/* Explainability & Grad-CAM Visualizer Area */}
          {prediction.realGradCamUrl ? (
            <div style={{ border: '1px solid var(--doctor-border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', backgroundColor: 'var(--doctor-bg)', borderBottom: '1px solid var(--doctor-border)', fontSize: '13px', fontWeight: 600 }}>
                Grad-CAM Heatmap Localization: {prediction.targetOrgan}
              </div>
              <div style={{ padding: '16px', display: 'flex', justifyContent: 'center' }}>
                <img
                  src={prediction.realGradCamUrl}
                  alt={`Grad-CAM heatmap localization for ${prediction.targetOrgan}`}
                  style={{ maxHeight: '260px', borderRadius: '8px', objectFit: 'contain' }}
                />
              </div>
            </div>
          ) : (
            /* Neutral un-fabricated state when no real visual asset exists */
            <div
              style={{
                padding: '16px 18px',
                backgroundColor: 'var(--doctor-bg)',
                border: '1px solid var(--doctor-border)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--doctor-card)',
                  border: '1px solid var(--doctor-border)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '16px',
                  flexShrink: 0,
                }}
              >
                📊
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--doctor-text-primary)' }}>
                  Grad-CAM visualization unavailable
                </strong>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--doctor-text-muted)', lineHeight: 1.5 }}>
                  Visual pixel-level heatmap image asset is not provided for this scan record. Advisory diagnostic attention localization is documented via textual saliency telemetry below.
                </p>
              </div>
            </div>
          )}

          {/* Clinical Saliency Explanation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
              Grad-CAM Saliency Analysis & Model Explanation:
            </span>
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--doctor-text-secondary)',
                lineHeight: 1.5,
                backgroundColor: 'var(--doctor-bg)',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--doctor-border)',
              }}
            >
              {prediction.explanation}
            </p>
          </div>

          {/* Strict Clinical Safety Disclaimer */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--doctor-warning-bg)',
              borderRadius: '8px',
              borderLeft: '4px solid var(--doctor-warning)',
              fontSize: '12px',
              color: '#78350f',
              lineHeight: 1.45,
            }}
          >
            <strong>Human-in-the-Loop Clinical Mandate:</strong> This AI feature provides advisory diagnostic decision support. It does not replace comprehensive clinical examination, patient history, or certified radiologist sign-off.
          </div>
        </div>

        {/* Footer */}
        <div className="doctor-modal-footer">
          <button className="doctor-btn doctor-btn-primary" onClick={onClose}>
            Close Decision Support
          </button>
        </div>
      </div>
    </div>
  );
}

export default AiExplainabilityModal;
