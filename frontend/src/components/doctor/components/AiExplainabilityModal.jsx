import React, { useState } from 'react';

export function AiExplainabilityModal({ isOpen, onClose, prediction, patientName }) {
  const [showHeatmap, setShowHeatmap] = useState(true);

  if (!isOpen || !prediction) return null;

  return (
    <div className="doctor-modal-overlay" onClick={onClose}>
      <div className="doctor-modal-box lg" onClick={(e) => e.stopPropagation()}>
        <div className="doctor-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="doctor-badge doctor-badge-draft">{prediction.pipeline}</span>
              <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>Model: {prediction.modelEngine || 'ResNet50-Ortho-v2.4'}</span>
            </div>
            <h3 className="doctor-modal-title" style={{ marginTop: '4px' }}>
              AI Clinical Decision Support & Heatmap Explainability
            </h3>
            <div style={{ fontSize: '12.5px', color: 'var(--doctor-text-muted)' }}>
              Authorized Patient: <strong>{patientName}</strong> • Date: {prediction.date}
            </div>
          </div>
          <button className="doctor-btn-icon" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="doctor-modal-body">
          {/* Finding summary pill */}
          <div style={{ padding: '14px 18px', backgroundColor: prediction.riskLevel === 'High' ? 'var(--doctor-soft-coral)' : 'var(--doctor-soft-teal)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '11.5px', color: prediction.riskLevel === 'High' ? 'var(--doctor-coral)' : 'var(--doctor-teal)', fontWeight: 700, textTransform: 'uppercase' }}>
                AI Diagnostic Telemetry Result
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--doctor-text-primary)', marginTop: '2px' }}>
                {prediction.finding}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                Target Region: <strong>{prediction.targetOrgan}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 800, color: prediction.riskLevel === 'High' ? 'var(--doctor-coral)' : 'var(--doctor-teal)' }}>
                {prediction.confidence}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)', fontWeight: 600 }}>Model Confidence</div>
            </div>
          </div>

          {/* Radiograph + Grad-CAM Viewer Visualizer */}
          <div style={{ border: '1px solid var(--doctor-border)', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#0f172a' }}>
            <div style={{ padding: '10px 16px', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ color: '#f8fafc', fontSize: '13px', fontWeight: 600 }}>
                Digital Plain Radiograph ({prediction.targetOrgan})
              </span>
              {prediction.gradCamAvailable && (
                <button
                  className={`doctor-btn doctor-btn-sm ${showHeatmap ? 'doctor-btn-primary' : 'doctor-btn-outline'}`}
                  style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => setShowHeatmap(!showHeatmap)}
                >
                  {showHeatmap ? 'Grad-CAM Heatmap: ON' : 'Grad-CAM Heatmap: OFF'}
                </button>
              )}
            </div>

            {/* Simulated X-Ray Canvas */}
            <div style={{ height: '240px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #334155 0%, #0f172a 100%)' }}>
              {/* Bone schematic silhouette */}
              <div style={{ width: '120px', height: '180px', border: '2px dashed rgba(255,255,255,0.4)', borderRadius: '40px', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '13px', textAlign: 'center', padding: '10px' }}>
                <span>{prediction.targetOrgan} Radiograph</span>
              </div>

              {/* Heatmap Overlay */}
              {showHeatmap && prediction.gradCamAvailable && (
                <div style={{ position: 'absolute', width: '90px', height: '90px', borderRadius: '50%', background: prediction.riskLevel === 'High' ? 'radial-gradient(circle, rgba(225,29,72,0.8) 0%, rgba(245,158,11,0.5) 50%, transparent 80%)' : 'radial-gradient(circle, rgba(16,185,129,0.7) 0%, rgba(59,130,246,0.4) 50%, transparent 80%)', filter: 'blur(8px)', animation: 'pulse 2s infinite' }} />
              )}
            </div>
          </div>

          {/* Clinical Explanation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--doctor-text-primary)' }}>
              Grad-CAM Saliency Saliency Analysis & Model Explanation:
            </span>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-secondary)', lineHeight: 1.5, backgroundColor: 'var(--doctor-bg)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--doctor-border)' }}>
              {prediction.explanation}
            </p>
          </div>

          {/* Strict Clinical Disclaimer */}
          <div style={{ padding: '10px 14px', backgroundColor: 'var(--doctor-warning-bg)', borderRadius: '8px', borderLeft: '4px solid var(--doctor-warning)', fontSize: '12px', color: '#78350f', lineHeight: 1.4 }}>
            <strong>Human-in-the-Loop Clinical Mandate:</strong> This AI feature provides advisory diagnostic decision support. It does not replace comprehensive clinical examination, patient history, or certified radiologist sign-off.
          </div>
        </div>

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
