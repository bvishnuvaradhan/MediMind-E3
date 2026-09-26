// MediMind Platform - AI Analytics (Chairman / Platform Owner)
// Section 13 of PLATFORM OWNER.txt: Platform-wide aggregate clinical AI analytics
// Strict Privacy: Model performance & aggregate distribution only; strictly NO individual patient scans or diagnosis records.

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Activity,
  HeartPulse,
  Stethoscope,
  ShieldCheck,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';
import { LineChart, RadarChart } from '../../common/charts';

export function AiAnalyticsView() {
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await chairmanService.getAiAnalytics();
      setAiData(data);
    }
    load();
  }, []);

  if (!aiData) return <div className="loading-state">Loading AI Analytics...</div>;

  const { modules, totalPredictions, monthlyVolume } = aiData;

  return (
    <div className="ai-analytics-view">
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <Sparkles size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Clinical Intelligence
            </p>
            <h1>Platform AI Diagnostic Analytics</h1>
            <p>Aggregate performance, inference volume, and confidence metrics for MediMind's locked clinical AI models.</p>
          </div>
        </div>
      </div>

      {/* Aggregate Model KPIs */}
      <div className="stats-grid">
        <div className="stat-card">
          <p>Total Model Inferences</p>
          <h3 style={{ marginTop: '8px' }}>{totalPredictions}</h3>
          <span className="stat-delta">+24% vs last month</span>
        </div>
        <div className="stat-card">
          <p>🦴 Fracture Detection (CNN)</p>
          <h3 style={{ marginTop: '8px' }}>{modules.fracture.totalRuns}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Avg Confidence: {modules.fracture.avgConfidence}</small>
        </div>
        <div className="stat-card">
          <p>🩺 Diabetes Risk (ML)</p>
          <h3 style={{ marginTop: '8px' }}>{modules.diabetes.totalRuns}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Avg Confidence: {modules.diabetes.avgConfidence}</small>
        </div>
        <div className="stat-card">
          <p>❤️ Heart Disease Risk (ML)</p>
          <h3 style={{ marginTop: '8px' }}>{modules.heartDisease.totalRuns}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Avg Confidence: {modules.heartDisease.avgConfidence}</small>
        </div>
      </div>

      {/* Deep Dive into the 3 Clinical AI Modules */}
      <h2 style={{ fontSize: '18px', fontFamily: 'Plus Jakarta Sans', margin: '28px 0 16px' }}>
        Active Diagnostic Service Specifications & Model Health
      </h2>

      <div className="ai-services-grid">
        {/* Module 1: Fracture Detection */}
        <div className="ai-service-card">
          <div className="ai-service-header">
            <div className="ai-service-icon blue">
              <Activity size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
                {modules.fracture.name}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>
                Department: {modules.fracture.department}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--chair-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            Architecture: <b>{modules.fracture.modelArchitecture}</b>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--chair-bg)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span>Fracture Detected:</span>
              <strong>{modules.fracture.detectedCount} runs (61%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Normal / Negative:</span>
              <strong>{modules.fracture.normalCount} runs (39%)</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', paddingTop: '12px', borderTop: '1px solid var(--chair-border)', fontSize: '11px' }}>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>ACCURACY</span>
              <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{modules.fracture.modelAccuracy}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>LATENCY</span>
              <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{modules.fracture.avgInferenceLatency}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>STATUS</span>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#16a34a', marginTop: '2px' }}>Active</div>
            </div>
          </div>
        </div>

        {/* Module 2: Diabetes Risk */}
        <div className="ai-service-card">
          <div className="ai-service-header">
            <div className="ai-service-icon teal">
              <Stethoscope size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
                {modules.diabetes.name}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>
                Department: {modules.diabetes.department}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--chair-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            Architecture: <b>{modules.diabetes.modelArchitecture}</b>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--chair-bg)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>High Risk:</span>
              <strong style={{ color: '#dc2626' }}>{modules.diabetes.highRiskCount} runs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>Moderate Risk:</span>
              <strong style={{ color: '#d97706' }}>{modules.diabetes.moderateRiskCount} runs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Low Risk:</span>
              <strong style={{ color: '#16a34a' }}>{modules.diabetes.lowRiskCount} runs</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', paddingTop: '12px', borderTop: '1px solid var(--chair-border)', fontSize: '11px' }}>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>ACCURACY</span>
              <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{modules.diabetes.modelAccuracy}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>LATENCY</span>
              <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{modules.diabetes.avgInferenceLatency}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>STATUS</span>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#16a34a', marginTop: '2px' }}>Active</div>
            </div>
          </div>
        </div>

        {/* Module 3: Heart Disease Risk */}
        <div className="ai-service-card">
          <div className="ai-service-header">
            <div className="ai-service-icon indigo">
              <HeartPulse size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
                {modules.heartDisease.name}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>
                Department: {modules.heartDisease.department}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--chair-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
            Architecture: <b>{modules.heartDisease.modelArchitecture}</b>
          </div>

          <div style={{ padding: '12px', borderRadius: '10px', background: 'var(--chair-bg)', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>High Risk:</span>
              <strong style={{ color: '#dc2626' }}>{modules.heartDisease.highRiskCount} runs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>Moderate Risk:</span>
              <strong style={{ color: '#d97706' }}>{modules.heartDisease.moderateRiskCount} runs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Low Risk:</span>
              <strong style={{ color: '#16a34a' }}>{modules.heartDisease.lowRiskCount} runs</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center', paddingTop: '12px', borderTop: '1px solid var(--chair-border)', fontSize: '11px' }}>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>ACCURACY</span>
              <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{modules.heartDisease.modelAccuracy}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>LATENCY</span>
              <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{modules.heartDisease.avgInferenceLatency}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>STATUS</span>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#16a34a', marginTop: '2px' }}>Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics: Monthly Trajectory Line Chart & Multi-Attribute Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px', marginTop: '24px' }}>
        {/* Multi-series Area / Line Chart */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
              Monthly Clinical Prediction Volume Trajectory
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              Five-month progression across 3 locked clinical AI models (May – Sep 2026)
            </p>
          </div>

          <LineChart
            data={monthlyVolume}
            xKey="month"
            height={200}
            yAxisLabel="Inferences"
            series={[
              { key: 'fracture', name: 'Fracture CNN', color: '#2563eb', area: true, fillOpacity: 0.2 },
              { key: 'diabetes', name: 'Diabetes ML', color: '#0f766e', area: true, fillOpacity: 0.15 },
              { key: 'heart', name: 'Heart ML', color: '#4338ca', area: true, fillOpacity: 0.12 },
            ]}
          />
        </div>

        {/* Model Capability Radar Comparison */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
              Multidimensional Diagnostic Calibration Radar
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              Comparative benchmark scoring across clinical performance dimensions
            </p>
          </div>

          <RadarChart
            metrics={['Accuracy', 'Sensitivity', 'Specificity', 'Speed', 'Uptime']}
            size={210}
            data={[
              { name: 'Fracture (ResNet50)', values: [97, 96, 98, 92, 99], color: '#2563eb' },
              { name: 'Diabetes (XGBoost)', values: [95, 94, 96, 95, 99], color: '#0f766e' },
              { name: 'Heart Disease (ML)', values: [95, 93, 97, 94, 99], color: '#4338ca' },
            ]}
          />
        </div>
      </div>

      {/* Monthly Volume Trend Table */}
      <div className="table-card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>
          Detailed Clinical Inferences Tabulation
        </h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timeline Period</th>
                <th>🦴 Fracture Detection</th>
                <th>🩺 Diabetes Risk</th>
                <th>❤️ Heart Disease Risk</th>
                <th>Total Inferences</th>
                <th>Growth Trend</th>
              </tr>
            </thead>
            <tbody>
              {monthlyVolume.map((m, idx) => (
                <tr key={m.month}>
                  <td><strong>{m.month}</strong></td>
                  <td>{m.fracture} runs</td>
                  <td>{m.diabetes} runs</td>
                  <td>{m.heart} runs</td>
                  <td><strong>{m.total}</strong></td>
                  <td>
                    <span className="badge badge-active">
                      {idx === 0 ? 'Baseline' : `+${Math.round(((m.total - monthlyVolume[idx - 1].total) / monthlyVolume[idx - 1].total) * 100)}%`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="privacy-banner" style={{ marginTop: '24px' }}>
        <ShieldCheck size={18} />
        <div>
          <strong>Clinical AI Decision-Support Disclaimer</strong>
          <p style={{ margin: '2px 0 0' }}>
            MediMind AI predictions are designed strictly for clinician decision-support and patient risk stratification. The Chairman monitors aggregate service reliability, model latency, and statistical calibration without access to patient-identifying radiographic images or clinical inputs.
          </p>
        </div>
      </div>
    </div>
  );
}
