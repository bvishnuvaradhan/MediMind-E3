import React from 'react';
import StatCard from '../components/StatCard';

export function AiAnalyticsView({ analytics }) {
  const aiData = analytics?.aiPipelineSummary || {
    pipelineName: 'Fracture Detection (CNN)',
    modelEngine: 'ResNet50-Ortho-v2.4',
    totalScans: 31,
    fracturesDetected: 19,
    normalScans: 12,
    accuracy: '97.4%',
    sensitivity: '96.8%',
    specificity: '98.1%',
    avgProcessingTime: '1.4s',
    uptime: '99.98%',
    commonFractureTypes: [
      { type: 'Distal Radius / Wrist', count: 8, confidence: '98.2%' },
      { type: 'Femoral Neck / Hip', count: 5, confidence: '96.5%' },
      { type: 'Tibia / Ankle Malleolus', count: 4, confidence: '97.1%' },
      { type: 'Clavicle Midshaft', count: 2, confidence: '95.8%' },
    ],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="dh-badge dh-badge-completed">Pipeline Online</span>
              <span style={{ fontSize: '13px', color: 'var(--dh-text-muted)' }}>Model: {aiData.modelEngine}</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              {aiData.pipelineName} Telemetry & Aggregate Diagnostics
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              Aggregate AI diagnostic accuracy, throughput telemetry, and anatomical fracture classification
            </p>
          </div>
          <div style={{ padding: '6px 12px', backgroundColor: 'var(--dh-soft-teal)', borderRadius: '6px', fontSize: '12px', color: 'var(--dh-teal)', fontWeight: 700 }}>
            Strict Aggregate Data (Zero PHI / Private Image Exposure)
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="dh-stat-grid">
        <StatCard
          label="Total Scans Screened"
          value={aiData.totalScans}
          tone="indigo"
          change="+12 this week"
          changeType="positive"
          subtext="Orthopedic X-Rays"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          }
        />
        <StatCard
          label="Diagnostic Accuracy"
          value={aiData.accuracy}
          tone="teal"
          change="Validated by Faculty"
          changeType="positive"
          subtext="Sensitivity 96.8%"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Fractures Detected"
          value={aiData.fracturesDetected}
          tone="coral"
          change="61.3% Positive Rate"
          changeType="neutral"
          subtext="12 Normal / Negative"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
        <StatCard
          label="Inference Latency"
          value={aiData.avgProcessingTime}
          tone="blue"
          change="Real-Time Triage"
          changeType="positive"
          subtext="Uptime 99.98%"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Two Columns: Anatomical Regions & Model Health */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Anatomical Regions */}
        <div className="dh-card">
          <div className="dh-card-header">
            <div>
              <h3 className="dh-card-title">Anatomical Fracture Distribution</h3>
              <div className="dh-card-description">Top fracture locations identified by AI pipeline</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {aiData.commonFractureTypes.map((f, i) => {
              const pct = Math.round((f.count / aiData.fracturesDetected) * 100);
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--dh-text-primary)' }}>{f.type}</span>
                    <span style={{ color: 'var(--dh-teal)', fontWeight: 700 }}>
                      {f.count} cases ({f.confidence} confidence)
                    </span>
                  </div>
                  <div className="dh-progress-container" style={{ height: '8px' }}>
                    <div className="dh-progress-fill teal" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model Infrastructure & Verification Protocol */}
        <div className="dh-card">
          <div className="dh-card-header">
            <div>
              <h3 className="dh-card-title">Pipeline Architecture & Clinical Protocols</h3>
              <div className="dh-card-description">Engine specifications and validation pipeline</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--dh-border)' }}>
              <span style={{ color: 'var(--dh-text-muted)' }}>Convolutional Architecture</span>
              <span style={{ fontWeight: 600 }}>Deep Residual Network (ResNet50)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--dh-border)' }}>
              <span style={{ color: 'var(--dh-text-muted)' }}>Input Modality</span>
              <span style={{ fontWeight: 600 }}>Digital Plain Radiographs (DICOM/PNG)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--dh-border)' }}>
              <span style={{ color: 'var(--dh-text-muted)' }}>Clinical Verification</span>
              <span style={{ fontWeight: 600, color: 'var(--dh-success)' }}>Mandatory Attending Radiologist Sign-off</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--dh-border)' }}>
              <span style={{ color: 'var(--dh-text-muted)' }}>Heatmap Localization</span>
              <span style={{ fontWeight: 600 }}>Grad-CAM Saliency Maps</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--dh-text-muted)' }}>Data Anonymization</span>
              <span style={{ fontWeight: 600, color: 'var(--dh-blue)' }}>HIPAA / ISO 27001 Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiAnalyticsView;
