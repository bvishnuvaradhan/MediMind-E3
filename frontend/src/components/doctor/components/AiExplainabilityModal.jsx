import React, { useEffect } from 'react';

export function AiExplainabilityModal({
  isOpen,
  onClose,
  prediction,
  patientName,
  onViewFullAnalysis,
}) {
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
    <div
      className="doctor-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-modal-title"
    >
      <div className="doctor-modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="doctor-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="doctor-badge doctor-badge-draft">
                {prediction.pipeline || 'AI Pre-Screen'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                Model: <strong>{prediction.modelEngine || 'ResNet50-Ortho-v2.4'}</strong>
              </span>
            </div>
            <h3 id="ai-modal-title" className="doctor-modal-title" style={{ marginTop: '4px' }}>
              AI Clinical Decision Support Summary
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
              Authorized Patient: <strong>{patientName}</strong> • Date: <strong>{prediction.date}</strong>
            </div>
          </div>
          <button className="doctor-btn-icon" onClick={onClose} aria-label="Close summary modal">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Concise Modal Body */}
        <div className="doctor-modal-body" tabIndex={0} style={{ outline: 'none' }}>
          {/* Finding summary pill */}
          <div
            style={{
              padding: '14px 18px',
              backgroundColor:
                prediction.riskLevel === 'High' ? 'var(--doctor-soft-coral)' : 'var(--doctor-soft-teal)',
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
                  fontSize: '11px',
                  color: prediction.riskLevel === 'High' ? 'var(--doctor-coral)' : 'var(--doctor-teal)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                AI Diagnostic Telemetry Result
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--doctor-text-primary)',
                  marginTop: '2px',
                }}
              >
                {prediction.finding}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)', marginTop: '2px' }}>
                Target Region: <strong>{prediction.targetOrgan || 'Right Knee & Distal Femur'}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: prediction.riskLevel === 'High' ? 'var(--doctor-coral)' : 'var(--doctor-teal)',
                }}
              >
                {prediction.confidence}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)', fontWeight: 600 }}>
                Confidence
              </div>
            </div>
          </div>

          {/* Saliency Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
              Explainability Telemetry:
            </span>
            <p
              style={{
                margin: 0,
                fontSize: '12.5px',
                color: 'var(--doctor-text-secondary)',
                lineHeight: 1.5,
                backgroundColor: 'var(--doctor-bg)',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--doctor-border)',
              }}
            >
              {prediction.explanation}
            </p>
          </div>

          {/* Human-in-the-Loop Clinical Disclaimer */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--doctor-warning-bg)',
              borderRadius: '8px',
              borderLeft: '4px solid var(--doctor-warning)',
              fontSize: '11.5px',
              color: '#78350f',
              lineHeight: 1.4,
            }}
          >
            <strong>Human-in-the-Loop Mandate:</strong> This advisory AI feature supports clinical workflow and does not replace certified physician assessment or radiologist sign-off.
          </div>
        </div>

        {/* Footer with View Full AI Analysis & Close */}
        <div className="doctor-modal-footer">
          <button type="button" className="doctor-btn doctor-btn-outline" onClick={onClose}>
            Close
          </button>
          {onViewFullAnalysis && (
            <button
              type="button"
              className="doctor-btn doctor-btn-primary"
              onClick={() => {
                onViewFullAnalysis(prediction, patientName);
              }}
            >
              View Full AI Analysis &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AiExplainabilityModal;
