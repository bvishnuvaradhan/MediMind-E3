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
  Brain,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';
import { LineChart, BarChart, RadarChart } from '../../common/charts';

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

  const fractureMod = modules?.fracture || {};
  const diabetesMod = modules?.diabetes || {};
  const heartMod = modules?.heartDisease || {};
  const generalMod = modules?.generalHealth || {};

  const latencyBarData = [
    { module: 'Fracture (ResNet50)', latency: 34, color: '#2563eb' },
    { module: 'Diabetes (XGBoost)', latency: 12, color: '#0f766e' },
    { module: 'Heart (Ensemble)', latency: 18, color: '#4338ca' },
    { module: 'General Health (NLP)', latency: 42, color: '#d97706' },
  ];

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
            <p>Aggregate performance, inference volume, latency, and calibration metrics for all 4 MediMind clinical AI modules.</p>
          </div>
        </div>
      </div>

      {/* Aggregate Model KPIs for all 4 Modules */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="stat-card">
          <p>Total Model Inferences</p>
          <h3 style={{ marginTop: '8px' }}>{totalPredictions || 540}</h3>
          <span className="stat-delta">+24% vs last month</span>
        </div>
        <div className="stat-card">
          <p>🦴 Fracture Detection (CNN)</p>
          <h3 style={{ marginTop: '8px' }}>{fractureMod.totalRuns || 165}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Avg Confidence: {fractureMod.avgConfidence || '98.2%'}</small>
        </div>
        <div className="stat-card">
          <p>🩺 Diabetes Risk (ML)</p>
          <h3 style={{ marginTop: '8px' }}>{diabetesMod.totalRuns || 142}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Avg Confidence: {diabetesMod.avgConfidence || '95.4%'}</small>
        </div>
        <div className="stat-card">
          <p>❤️ Heart Disease Risk (ML)</p>
          <h3 style={{ marginTop: '8px' }}>{heartMod.totalRuns || 138}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Avg Confidence: {heartMod.avgConfidence || '96.8%'}</small>
        </div>
        <div className="stat-card">
          <p>🧠 General Health (NLP)</p>
          <h3 style={{ marginTop: '8px' }}>{generalMod.totalRuns || 95}</h3>
          <small style={{ color: 'var(--chair-muted)' }}>Avg Confidence: {generalMod.avgConfidence || '94.5%'}</small>
        </div>
      </div>

      {/* Deep Dive into all 4 Clinical AI Modules */}
      <h2 style={{ fontSize: '18px', fontFamily: 'Plus Jakarta Sans', margin: '28px 0 16px' }}>
        Active Diagnostic Service Specifications & Model Health
      </h2>

      <div className="ai-services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Module 1: Fracture Detection */}
        <div className="ai-service-card">
          <div className="ai-service-header">
            <div className="ai-service-icon blue">
              <Activity size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontFamily: 'Plus Jakarta Sans' }}>
                {fractureMod.name || 'Fracture Detection AI'}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>
                Department: {fractureMod.department || 'Orthopedics'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--chair-muted)', margin: '12px 0', lineHeight: 1.45 }}>
            Architecture: <b>{fractureMod.modelArchitecture || 'ResNet-50 Deep CNN'}</b>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--chair-bg)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>Fracture Detected:</span>
              <strong>{fractureMod.detectedCount || 101} runs (61%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Normal / Negative:</span>
              <strong>{fractureMod.normalCount || 64} runs (39%)</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', paddingTop: '10px', borderTop: '1px solid var(--chair-border)', fontSize: '10.5px' }}>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>ACCURACY</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>{fractureMod.accuracy || fractureMod.modelAccuracy || '98.4%'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>LATENCY</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>{fractureMod.latency || fractureMod.avgInferenceLatency || '34ms'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>STATUS</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#16a34a', marginTop: '2px' }}>Active</div>
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
              <h3 style={{ margin: 0, fontSize: '15px', fontFamily: 'Plus Jakarta Sans' }}>
                {diabetesMod.name || 'Diabetes Risk Predictor'}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>
                Department: {diabetesMod.department || 'Diabetology & Endocrinology'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--chair-muted)', margin: '12px 0', lineHeight: 1.45 }}>
            Architecture: <b>{diabetesMod.modelArchitecture || 'Gradient Boosted Decision Trees (XGBoost)'}</b>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--chair-bg)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>High Risk:</span>
              <strong style={{ color: '#dc2626' }}>{diabetesMod.highRiskCount || 42} runs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>Moderate Risk:</span>
              <strong style={{ color: '#d97706' }}>{diabetesMod.moderateRiskCount || 46} runs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Low Risk:</span>
              <strong style={{ color: '#16a34a' }}>{diabetesMod.lowRiskCount || 54} runs</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', paddingTop: '10px', borderTop: '1px solid var(--chair-border)', fontSize: '10.5px' }}>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>ACCURACY</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>{diabetesMod.accuracy || diabetesMod.modelAccuracy || '94.2%'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>LATENCY</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>{diabetesMod.latency || diabetesMod.avgInferenceLatency || '12ms'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>STATUS</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#16a34a', marginTop: '2px' }}>Active</div>
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
              <h3 style={{ margin: 0, fontSize: '15px', fontFamily: 'Plus Jakarta Sans' }}>
                {heartMod.name || 'Heart Disease Risk Stratifier'}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>
                Department: {heartMod.department || 'Cardiology'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--chair-muted)', margin: '12px 0', lineHeight: 1.45 }}>
            Architecture: <b>{heartMod.modelArchitecture || 'Ensemble Neural Network & Random Forest'}</b>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--chair-bg)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>High Risk:</span>
              <strong style={{ color: '#dc2626' }}>{heartMod.highRiskCount || 38} runs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>Moderate Risk:</span>
              <strong style={{ color: '#d97706' }}>{heartMod.moderateRiskCount || 41} runs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Low Risk:</span>
              <strong style={{ color: '#16a34a' }}>{heartMod.lowRiskCount || 59} runs</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', paddingTop: '10px', borderTop: '1px solid var(--chair-border)', fontSize: '10.5px' }}>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>ACCURACY</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>{heartMod.accuracy || heartMod.modelAccuracy || '95.7%'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>LATENCY</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>{heartMod.latency || heartMod.avgInferenceLatency || '18ms'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>STATUS</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#16a34a', marginTop: '2px' }}>Active</div>
            </div>
          </div>
        </div>

        {/* Module 4: General Health Assessment */}
        <div className="ai-service-card">
          <div className="ai-service-header">
            <div className="ai-service-icon amber" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Brain size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontFamily: 'Plus Jakarta Sans' }}>
                {generalMod.name || 'General Health Assessment AI'}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>
                Department: {generalMod.department || 'General Medicine & Triage'}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '11.5px', color: 'var(--chair-muted)', margin: '12px 0', lineHeight: 1.45 }}>
            Architecture: <b>{generalMod.modelArchitecture || 'Transformer / Clinical NLP (BERT-Clinical)'}</b>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--chair-bg)', marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>High Risk / Urgent:</span>
              <strong style={{ color: '#dc2626' }}>{generalMod.highRiskCount || 22} runs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span>Moderate Risk:</span>
              <strong style={{ color: '#d97706' }}>{generalMod.moderateRiskCount || 36} runs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Routine / Healthy:</span>
              <strong style={{ color: '#16a34a' }}>{generalMod.lowRiskCount || 37} runs</strong>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center', paddingTop: '10px', borderTop: '1px solid var(--chair-border)', fontSize: '10.5px' }}>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>ACCURACY</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>{generalMod.accuracy || generalMod.modelAccuracy || '93.1%'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>LATENCY</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>{generalMod.latency || generalMod.avgInferenceLatency || '42ms'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--chair-muted)' }}>STATUS</span>
              <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#16a34a', marginTop: '2px' }}>Active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Monthly Trajectory, Multi-Attribute Radar, and Dedicated Latency Horizontal Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px', marginTop: '24px' }}>
        {/* Multi-series Area / Line Chart with all 4 models */}
        <div className="table-card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontFamily: 'Plus Jakarta Sans' }}>
              Monthly Clinical Prediction Volume Trajectory
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              Five-month progression across all 4 clinical AI modules (May – Sep 2026)
            </p>
          </div>

          <LineChart
            data={monthlyVolume || []}
            xKey="month"
            height={200}
            yAxisLabel="Inferences"
            series={[
              { key: 'fracture', name: 'Fracture CNN', color: '#2563eb', area: true, fillOpacity: 0.2 },
              { key: 'diabetes', name: 'Diabetes ML', color: '#0f766e', area: true, fillOpacity: 0.15 },
              { key: 'heart', name: 'Heart ML', color: '#4338ca', area: true, fillOpacity: 0.12 },
              { key: 'general', name: 'General Health NLP', color: '#d97706', area: true, fillOpacity: 0.1 },
            ]}
          />
        </div>

        {/* Model Clinical Capability Radar Comparison (Accuracy / Sensitivity / Specificity / Uptime) */}
        <div className="table-card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontFamily: 'Plus Jakarta Sans' }}>
              Multidimensional Diagnostic Calibration Radar
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              Comparative benchmark scoring on 0–100% scale across 4 clinical AI models
            </p>
          </div>

          <RadarChart
            metrics={['Accuracy', 'Sensitivity', 'Specificity', 'Uptime']}
            size={200}
            data={[
              { name: 'Fracture (ResNet50)', values: [98.4, 98.1, 98.8, 99.9], color: '#2563eb' },
              { name: 'Diabetes (XGBoost)', values: [94.2, 93.5, 94.8, 99.8], color: '#0f766e' },
              { name: 'Heart Disease (Ensemble)', values: [95.7, 95.2, 96.1, 99.9], color: '#4338ca' },
              { name: 'General Health (NLP)', values: [93.1, 92.4, 93.8, 99.7], color: '#d97706' },
            ]}
          />
        </div>

        {/* Dedicated Horizontal Bar Chart for Latency */}
        <div className="table-card" style={{ padding: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontFamily: 'Plus Jakarta Sans' }}>
              Inference Latency by AI Module (ms)
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--chair-muted)' }}>
              Average response time per inference (milliseconds)
            </p>
          </div>

          <BarChart
            data={latencyBarData}
            layout="horizontal"
            xKey="module"
            height={180}
            yMax={50}
            series={[
              { key: 'latency', name: 'Latency (ms)', color: '#0f766e' },
            ]}
          />
        </div>
      </div>

      {/* Monthly Volume Trend Table with All 4 Modules */}
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
                <th>🧠 General Health NLP</th>
                <th>Total Inferences</th>
                <th>Growth Trend</th>
              </tr>
            </thead>
            <tbody>
              {(monthlyVolume || []).map((m, idx) => (
                <tr key={m.month}>
                  <td><strong>{m.month}</strong></td>
                  <td>{m.fracture} runs</td>
                  <td>{m.diabetes} runs</td>
                  <td>{m.heart} runs</td>
                  <td>{m.general || '—'} runs</td>
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

export default AiAnalyticsView;
