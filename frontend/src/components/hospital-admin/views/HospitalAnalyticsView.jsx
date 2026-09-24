import {
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  Users,
  CheckCircle,
  Building2,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';

export function HospitalAnalyticsView({ analytics, hospital }) {
  const kpis = analytics.kpis || {};
  const trends = analytics.monthlyTrends || [];

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1>Hospital Operational Analytics</h1>
            <p>Comprehensive aggregate operational performance, appointment throughput, clinical staff utilization, and monthly volume trends</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <Activity size={16} style={{ color: 'var(--ha-teal)' }} />
          <span>Real-time hospital intelligence · Cycle: September 2026</span>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="ha-stat-grid">
        <StatCard
          label="Total Hospital Bookings"
          value={kpis.totalAppointments || 128}
          subtext="Monthly volume (+4.9% vs Aug)"
          icon={Calendar}
          tone="primary"
          isPositive
        />
        <StatCard
          label="Consultations Resolved"
          value={kpis.completedConsultations || 104}
          subtext="81.2% Total Resolution Rate"
          icon={CheckCircle}
          tone="teal"
          isPositive
        />
        <StatCard
          label="Staff Clinical Utilization"
          value={kpis.averageDoctorWorkload || '62%'}
          subtext="Balanced doctor caseload"
          icon={Users}
          tone="indigo"
        />
        <StatCard
          label="Hospital Bed Occupancy"
          value={hospital.occupancyRate || '84%'}
          subtext="210 of 250 Total Beds"
          icon={Building2}
          tone="warning"
        />
      </div>

      {/* Monthly Volume Trend Table & Visual Chart */}
      <div className="ha-card-panel">
        <div className="ha-card-panel-header">
          <div>
            <h3>Monthly Intake & AI Screening Growth (May - Sep 2026)</h3>
            <p>Five-month retrospective progression of appointments and diagnostic assistance</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {trends.map((item) => (
            <div
              key={item.month}
              style={{
                padding: '16px',
                borderRadius: '10px',
                backgroundColor: 'var(--ha-bg)',
                border: '1px solid var(--ha-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ha-text-muted)', textTransform: 'uppercase' }}>
                {item.month}
              </span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
                {item.appointments} Bookings
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ha-teal)', fontWeight: 600 }}>
                {item.completed} Completed
              </div>
              <div style={{ fontSize: '11px', color: 'var(--ha-primary)' }}>
                <Sparkles size={11} style={{ display: 'inline', marginRight: '3px' }} />
                {item.aiUsage} AI Scans
              </div>
            </div>
          ))}
        </div>

        {/* Operational Efficiency Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', paddingTop: '16px', borderTop: '1px solid var(--ha-border)' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span>On-Time Appointment Fulfillment</span>
              <strong>{kpis.onTimeCompletionRate || '94.2%'}</strong>
            </div>
            <div className="ha-progress-bar-bg">
              <div className="ha-progress-bar-fill" style={{ width: '94.2%' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span>Patient Clinical Satisfaction</span>
              <strong>{kpis.patientSatisfactionScore || '4.8 / 5.0'} (96%)</strong>
            </div>
            <div className="ha-progress-bar-bg">
              <div className="ha-progress-bar-fill" style={{ width: '96%', background: 'linear-gradient(90deg, #10b981, #0f766e)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

