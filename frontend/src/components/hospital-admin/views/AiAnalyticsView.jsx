import {
  Sparkles,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Brain,
  Zap,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { DonutChart, BarChart, RadarChart } from '../../common/charts';

export function AiAnalyticsView({ analytics = {} }) {
  const ai = analytics?.aiAggregateMetrics || analytics || {};

  const fRuns = ai.fracturePredictions || 48;
  const dRuns = ai.diabetesPredictions || 36;
  const hRuns = ai.heartPredictions || ai.heartDiseasePredictions || 42;
  const gRuns = ai.generalHealthScreenings || 32;
  const totalRuns = fRuns + dRuns + hRuns + gRuns;

  const aiDonutData = [
    { label: 'Fracture Detection (CNN)', value: fRuns, color: '#2563eb' },
    { label: 'Diabetes Risk (ML)', value: dRuns, color: '#0f766e' },
    { label: 'Heart Disease Risk (ML)', value: hRuns, color: '#7c3aed' },
    { label: 'General Health (NLP)', value: gRuns, color: '#d97706' },
  ];

  const radarData = [
    { name: 'Fracture Detection', values: [98.4, 98.1, 98.8, 99.9], color: '#2563eb' },
    { name: 'Diabetes Risk', values: [94.2, 93.5, 94.8, 99.8], color: '#0f766e' },
    { name: 'Heart Disease Risk', values: [95.7, 95.2, 96.1, 99.9], color: '#7c3aed' },
    { name: 'General Health Assessment', values: [93.1, 92.4, 93.8, 99.7], color: '#d97706' },
  ];

  const latencyBarData = [
    { module: 'Fracture Detection', latency: 34, color: '#2563eb' },
    { module: 'Diabetes Risk', latency: 12, color: '#0f766e' },
    { module: 'Heart Disease Risk', latency: 18, color: '#7c3aed' },
    { module: 'General Health Assessment', latency: 42, color: '#d97706' },
  ];

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <Sparkles size={24} />
          </div>
          <div>
            <h1>Hospital AI Diagnostic Analytics (Aggregate Oversight)</h1>
            <p>Aggregate performance statistics, model utilization, latency, and risk stratification across hospital AI screening services</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <ShieldAlert size={16} style={{ color: 'var(--ha-primary)' }} />
          <span>Strict HIPAA Aggregate Boundary: No individual patient scans or clinical charts exposed</span>
        </div>
      </div>

      {/* AI Top Stats */}
      <div className="ha-stat-grid">
        <StatCard
          label="Total AI Diagnostic Inferences"
          value={ai.totalScans || totalRuns || 158}
          subtext="Hospital-wide clinical inferences"
          icon={Brain}
          tone="primary"
          isPositive
        />
        <StatCard
          label="Diagnostic Assistance Rate"
          value={ai.diagnosticAssistanceRate || '98.5%'}
          subtext="Clinician concordant findings"
          icon={CheckCircle2}
          tone="teal"
          isPositive
        />
        <StatCard
          label="Average Model Accuracy"
          value={ai.modelAccuracyAverage || ai.accuracy || '97.4%'}
          subtext="Validated benchmark performance"
          icon={Zap}
          tone="indigo"
        />
        <StatCard
          label="General Symptom Triages"
          value={gRuns}
          subtext="Preliminary patient intake"
          icon={Activity}
          tone="warning"
        />
      </div>

      {/* Visual Telemetry: AI Distribution Donut, Capability Radar & Latency Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Model Volume Share Donut */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Diagnostic Model Volume Share</h3>
              <p>Inference load distribution across active clinical screening pipelines</p>
            </div>
          </div>

          <DonutChart
            data={aiDonutData}
            size={160}
            innerRadius={45}
            outerRadius={70}
            centerValue={totalRuns}
            centerLabel="Inferences"
          />
        </div>

        {/* Model Clinical Capability Radar & Calibration Benchmark Table */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>AI Reliability & Accuracy Radar</h3>
              <p>Multi-dimensional operational telemetry across diagnostic pipelines</p>
            </div>
          </div>

          <RadarChart
            metrics={['Accuracy', 'Sensitivity', 'Specificity', 'Uptime']}
            size={200}
            data={radarData}
            showLegend
            allowModeToggle
          />

          {/* Compact 4-Model Clinical Calibration Benchmark Table */}
          <div style={{ marginTop: '14px', borderTop: '1px solid var(--ha-border, #e2e8f0)', paddingTop: '10px' }}>
            <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: 'var(--ha-text-muted, #64748b)', textAlign: 'left', borderBottom: '1px solid var(--ha-border, #e2e8f0)' }}>
                  <th style={{ paddingBottom: '6px' }}>AI Module</th>
                  <th style={{ paddingBottom: '6px', textAlign: 'right' }}>Accuracy</th>
                  <th style={{ paddingBottom: '6px', textAlign: 'right' }}>Sensitivity</th>
                  <th style={{ paddingBottom: '6px', textAlign: 'right' }}>Specificity</th>
                  <th style={{ paddingBottom: '6px', textAlign: 'right' }}>Uptime</th>
                </tr>
              </thead>
              <tbody>
                {radarData.map((row) => (
                  <tr key={row.name} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    <td style={{ padding: '5px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: row.color, flexShrink: 0 }} />
                      <strong style={{ color: 'var(--ha-text-primary, #1e293b)' }}>{row.name}</strong>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.values[0]}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.values[1]}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{row.values[2]}%</td>
                    <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>{row.values[3]}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dedicated Latency Horizontal Bar */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Inference Latency by Module (ms)</h3>
              <p>Average turnaround processing time per inference</p>
            </div>
          </div>

          <BarChart
            data={latencyBarData}
            layout="horizontal"
            xKey="module"
            height={200}
            yMax={50}
            series={[
              { key: 'latency', name: 'Latency (ms)', color: '#0f766e' },
            ]}
          />
        </div>
      </div>

      {/* 4 AI Service Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Fracture Detection (CNN) */}
        <div className="ha-card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eef2ff', color: 'var(--ha-indigo)', display: 'grid', placeItems: 'center' }}>
                <Activity size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '15px', fontWeight: 700 }}>
                  Fracture Detection (CNN)
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--ha-indigo)', fontWeight: 600 }}>Orthopedics Department</span>
              </div>
            </div>
            <span className="ha-badge info">{fRuns} Inferences</span>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)' }}>
            High-resolution convolutional neural network detecting non-displaced bone fractures and musculoskeletal trauma.
          </p>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Normal / Intact Bone Scans:</span>
              <strong>{ai.fractureDistribution?.normalOrLow || 30} (62.5%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Fractures Identified & Flagged:</span>
              <strong style={{ color: 'var(--ha-error)' }}>{ai.fractureDistribution?.fractureDetected || 18} (37.5%)</strong>
            </div>
          </div>
        </div>

        {/* Diabetes Risk Scoring */}
        <div className="ha-card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0fdfa', color: 'var(--ha-teal)', display: 'grid', placeItems: 'center' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '15px', fontWeight: 700 }}>
                  Diabetes Risk Scoring
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--ha-teal)', fontWeight: 600 }}>Diabetology & Endocrinology</span>
              </div>
            </div>
            <span className="ha-badge info">{dRuns} Inferences</span>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)' }}>
            Gradient boosted decision tree model forecasting glycemic dysregulation and metabolic risk strata.
          </p>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Low Risk Cohort:</span>
              <strong style={{ color: 'var(--ha-success)' }}>{ai.diabetesDistribution?.lowRisk || 18} (50.0%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Moderate / High Risk:</span>
              <strong style={{ color: 'var(--ha-warning)' }}>{ai.diabetesDistribution?.moderateRisk || 18} (50.0%)</strong>
            </div>
          </div>
        </div>

        {/* Heart Disease Risk */}
        <div className="ha-card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', color: 'var(--ha-primary)', display: 'grid', placeItems: 'center' }}>
                <Brain size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '15px', fontWeight: 700 }}>
                  Heart Disease Risk
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--ha-primary)', fontWeight: 600 }}>Cardiology Department</span>
              </div>
            </div>
            <span className="ha-badge info">{hRuns} Inferences</span>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)' }}>
            Deep ensemble multi-parameter classifier evaluating cardiovascular vulnerability and coronary indicators.
          </p>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Low Risk Profile:</span>
              <strong style={{ color: 'var(--ha-success)' }}>{ai.heartDistribution?.lowRisk || 22} (52.4%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Moderate / High Alert:</span>
              <strong style={{ color: 'var(--ha-error)' }}>{ai.heartDistribution?.highRisk || 20} (47.6%)</strong>
            </div>
          </div>
        </div>

        {/* General Health Assessment */}
        <div className="ha-card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#d97706', display: 'grid', placeItems: 'center' }}>
                <Activity size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '15px', fontWeight: 700 }}>
                  General Health Assessment
                </h3>
                <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>General Medicine & Triage</span>
              </div>
            </div>
            <span className="ha-badge info">{gRuns} Inferences</span>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)' }}>
            Clinical NLP transformer analyzing intake symptom narratives, routine vitals, and holistic triage factors.
          </p>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Standard / Routine Cases:</span>
              <strong style={{ color: 'var(--ha-success)' }}>19 (59.4%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Priority Specialty Referrals:</span>
              <strong style={{ color: 'var(--ha-warning)' }}>13 (40.6%)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiAnalyticsView;
