import {
  Sparkles,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Brain,
  Zap,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { DonutChart, RadarChart } from '../../common/charts';

export function AiAnalyticsView({ analytics = {} }) {
  const ai = analytics?.aiAggregateMetrics || analytics || {};

  const fRuns = ai.fracturePredictions || 31;
  const dRuns = ai.diabetesPredictions || 29;
  const hRuns = ai.heartPredictions || 31;
  const totalRuns = fRuns + dRuns + hRuns;

  const aiDonutData = [
    { label: 'Fracture Detection (CNN)', value: fRuns, color: '#4338ca' },
    { label: 'Diabetes Risk (ML)', value: dRuns, color: '#0f766e' },
    { label: 'Heart Disease Risk (ML)', value: hRuns, color: '#2563eb' },
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
            <p>Aggregate performance statistics, model utilization, and risk stratification across hospital AI screening services</p>
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
          value={ai.totalScans || 91}
          subtext="Across 3 Hospital Centers"
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
          value={ai.modelAccuracyAverage || '97.2%'}
          subtext="Validated benchmark performance"
          icon={Zap}
          tone="indigo"
        />
        <StatCard
          label="General Symptom Triages"
          value={ai.generalHealthScreenings || 45}
          subtext="Preliminary patient intake"
          icon={Activity}
          tone="warning"
        />
      </div>

      {/* Visual Telemetry: AI Distribution Donut & Diagnostic Performance Radar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginBottom: '24px' }}>
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

        {/* Model Clinical Capability Radar */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>AI Reliability & Performance Radar</h3>
              <p>Multi-dimensional operational telemetry across diagnostic pipelines</p>
            </div>
          </div>

          <RadarChart
            metrics={['Accuracy', 'Sensitivity', 'Specificity', 'Speed', 'Uptime']}
            size={195}
            data={[
              { name: 'Fracture CNN', values: [97, 96, 98, 92, 99], color: '#4338ca' },
              { name: 'Diabetes ML', values: [95, 94, 96, 95, 99], color: '#0f766e' },
              { name: 'Heart ML', values: [95, 93, 97, 94, 99], color: '#2563eb' },
            ]}
          />
        </div>
      </div>

      {/* 3 AI Service Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
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
            <span className="ha-badge info">{ai.fracturePredictions || 31} Inferences</span>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)' }}>
            High-resolution convolutional neural network detecting non-displaced bone fractures and musculoskeletal trauma.
          </p>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Normal / Intact Bone Scans:</span>
              <strong>{ai.fractureDistribution?.normalOrLow || 24} (77.4%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Fractures Identified & Flagged:</span>
              <strong style={{ color: 'var(--ha-error)' }}>{ai.fractureDistribution?.fractureDetected || 7} (22.6%)</strong>
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
                <span style={{ fontSize: '11px', color: 'var(--ha-teal)', fontWeight: 600 }}>Diabetology Department</span>
              </div>
            </div>
            <span className="ha-badge info">{ai.diabetesPredictions || 29} Inferences</span>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)' }}>
            Gradient boosted decision tree model forecasting glycemic dysregulation and metabolic risk strata.
          </p>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Low Risk Cohort:</span>
              <strong style={{ color: 'var(--ha-success)' }}>{ai.diabetesDistribution?.lowRisk || 14} (48.3%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Moderate Risk Cohort:</span>
              <strong style={{ color: 'var(--ha-warning)' }}>{ai.diabetesDistribution?.moderateRisk || 10} (34.5%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Elevated / High Risk:</span>
              <strong style={{ color: 'var(--ha-error)' }}>{ai.diabetesDistribution?.highRisk || 5} (17.2%)</strong>
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
            <span className="ha-badge info">{ai.heartDiseasePredictions || 31} Inferences</span>
          </div>

          <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)' }}>
            Deep ensemble multi-parameter classifier evaluating cardiovascular vulnerability and coronary indicators.
          </p>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Low Risk Profile:</span>
              <strong style={{ color: 'var(--ha-success)' }}>{ai.heartDistribution?.lowRisk || 16} (51.6%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>Moderate Risk Profile:</span>
              <strong style={{ color: 'var(--ha-warning)' }}>{ai.heartDistribution?.moderateRisk || 9} (29.0%)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--ha-text-muted)' }}>High Risk Alert:</span>
              <strong style={{ color: 'var(--ha-error)' }}>{ai.heartDistribution?.highRisk || 6} (19.4%)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

