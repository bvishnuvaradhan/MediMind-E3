// MediMind Platform - Platform Appointments Overview (Chairman / Platform Owner)
// Pure aggregate platform-level appointment metrics and operational performance. Zero patient records or individual rows.

import { useState, useEffect } from 'react';
import {
  CalendarDays,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  Clock,
  XCircle,
  Video,
  UserCheck,
  PhoneCall,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';

export function AppointmentsView() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    async function loadData() {
      const data = await chairmanService.getAppointmentAnalytics();
      setAnalytics(data);
    }
    loadData();
  }, []);

  if (!analytics) {
    return <div className="loading-state">Loading Platform Appointments Analytics...</div>;
  }

  const maxTrendVolume = Math.max(...analytics.historicalMonthlyTrends.map((t) => t.volume), 1);

  return (
    <div className="appointments-view">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-title">
          <span className="view-header-icon">
            <CalendarDays size={24} />
          </span>
          <div>
            <p className="eyebrow" style={{ color: 'var(--chair-sapphire)' }}>
              Operational Performance & Audit
            </p>
            <h1>Platform Appointments Overview</h1>
            <p>Aggregate platform-wide consultation volume, monthly growth trends, and departmental throughput across member hospitals.</p>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee Banner */}
      <div className="privacy-banner">
        <ShieldCheck size={18} />
        <div>
          <strong>Institutional Aggregate Boundary</strong>
          <p style={{ margin: '2px 0 0' }}>
            The Chairman oversees macro-level scheduling throughput, completion rates, and network capacity. Individual patient medical concerns, private clinical charts, and doctor consultation actions remain strictly protected and confidential.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid: Overall Count, Growth, Completion, Utilization */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <CalendarDays size={20} />
            </span>
            <span className="stat-delta">
              +{analytics.percentageGrowth}% MoM
            </span>
          </div>
          <h3>{analytics.totalAppointments}</h3>
          <p>Total Platform Appointments</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            {analytics.currentMonthName} Cumulative
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}>
              <TrendingUp size={20} />
            </span>
            <span className="stat-delta" style={{ background: '#dcfce7', color: '#166534' }}>
              +{analytics.absoluteGrowth} Visits
            </span>
          </div>
          <h3>{analytics.currentMonthVolume}</h3>
          <p>Current vs Previous Month</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            {analytics.previousMonthVolume} in {analytics.previousMonthName}
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#ccfbf1', color: '#0f766e' }}>
              <CheckCircle size={20} />
            </span>
            <span className="stat-delta" style={{ background: '#ccfbf1', color: '#0f766e' }}>
              {analytics.completionRate} Rate
            </span>
          </div>
          <h3>{analytics.completedVolume}</h3>
          <p>Completed Consultations</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            {analytics.scheduledVolume} upcoming scheduled
          </small>
        </div>

        <div className="stat-card">
          <div className="stat-topline">
            <span className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
              <Activity size={20} />
            </span>
            <span className="stat-delta" style={{ background: '#fef3c7', color: '#92400e' }}>
              {analytics.utilizationRate}
            </span>
          </div>
          <h3>{analytics.averageConsultationsPerSpecialist}</h3>
          <p>Avg Visits per Doctor</p>
          <small style={{ color: 'var(--chair-muted)', marginTop: '4px' }}>
            Across 9 active clinical faculty
          </small>
        </div>
      </div>

      {/* Two Column Grid: Historical Trend + Resolution Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px', marginBottom: '28px' }}>
        
        {/* Historical Monthly Volume Trend */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>
                Historical Monthly Volume Trend
              </h3>
              <p style={{ margin: 0, color: 'var(--chair-muted)', fontSize: '12px' }}>
                5-month platform appointment growth trajectory
              </p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <ArrowUpRight size={13} /> +106% 5-mo growth
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {analytics.historicalMonthlyTrends.map((item) => {
              const pct = Math.round((item.volume / maxTrendVolume) * 100);
              return (
                <div key={item.month}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--chair-ink)' }}>{item.month}</strong>
                    <div style={{ display: 'flex', gap: '12px', color: 'var(--chair-muted)', fontSize: '11px' }}>
                      <span style={{ color: '#16a34a' }}>● {item.completed} completed</span>
                      <span style={{ color: '#d97706' }}>● {item.scheduled} scheduled</span>
                      <strong style={{ color: 'var(--chair-ink)' }}>{item.volume} total</strong>
                    </div>
                  </div>
                  <div style={{ height: '10px', background: 'var(--chair-border)', borderRadius: '5px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #2563eb, #312e81)',
                        borderRadius: '5px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '20px', padding: '12px 14px', borderRadius: '10px', background: 'var(--chair-bg)', fontSize: '12px', color: 'var(--chair-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span><b>May 2026 Baseline:</b> 62 visits</span>
            <span><b>Sep 2026 Current:</b> 128 visits (+66 net gain)</span>
          </div>
        </div>

        {/* Operational Status & Fulfillment Breakdown */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>
              Operational Status & Fulfillment
            </h3>
            <p style={{ margin: 0, color: 'var(--chair-muted)', fontSize: '12px' }}>
              Resolution status distribution for all platform appointments
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#dcfce7', borderRadius: '10px', color: '#166534' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={17} />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Completed Consultations</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '15px' }}>{analytics.completedVolume}</strong>
                <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '6px' }}>({analytics.completionRate})</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fef3c7', borderRadius: '10px', color: '#92400e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={17} />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Upcoming Scheduled Visits</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '15px' }}>{analytics.scheduledVolume}</strong>
                <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '6px' }}>({analytics.scheduledRate})</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#fee2e2', borderRadius: '10px', color: '#991b1b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <XCircle size={17} />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>Cancelled / Rescheduled</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong style={{ fontSize: '15px' }}>{analytics.cancelledVolume}</strong>
                <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: '6px' }}>({analytics.cancellationRate})</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--chair-indigo-soft)', fontSize: '12px', color: 'var(--chair-indigo)' }}>
            <b>Fulfillment Integrity:</b> 93.8% of scheduled encounters result in completed clinical consultations with minimal network cancellations.
          </div>
        </div>
      </div>

      {/* Two Column Grid: Department Throughput + Modality Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '22px', marginBottom: '28px' }}>
        
        {/* Department Throughput Breakdown */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#e0e7ff', color: '#4338ca' }}>
              <Layers size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>Department Throughput</h3>
              <small style={{ color: 'var(--chair-muted)' }}>Consultation volume distributed by clinical department</small>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {analytics.departmentThroughput.map((dept) => (
              <div key={dept.department} style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--chair-bg)', border: '1px solid var(--chair-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '13px' }}>{dept.department}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '14px', color: dept.color }}>{dept.count} visits</strong>
                    <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>({dept.percentage}%)</span>
                  </div>
                </div>
                <div style={{ height: '6px', background: 'var(--chair-border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ height: '100%', width: `${dept.percentage}%`, background: dept.color, borderRadius: '3px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--chair-muted)' }}>
                  <span>{dept.doctorsCount} Specialists</span>
                  <span>Avg {dept.avgPerDoctor} consultations / doctor</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consultation Modality Distribution */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#ccfbf1', color: '#0f766e' }}>
              <Video size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontFamily: 'Plus Jakarta Sans' }}>Consultation Modality Distribution</h3>
              <small style={{ color: 'var(--chair-muted)' }}>Delivery channel breakdown across the network</small>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {analytics.consultationModeDistribution.map((item) => {
              const Icon = item.mode.includes('In-person') ? UserCheck : item.mode.includes('Video') ? Video : PhoneCall;
              return (
                <div key={item.mode} style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--chair-bg)', border: '1px solid var(--chair-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon size={16} color={item.color} />
                      <strong style={{ fontSize: '13px' }}>{item.mode}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '14px' }}>{item.count}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--chair-muted)' }}>({item.percentage}%)</span>
                    </div>
                  </div>
                  <div style={{ height: '6px', background: 'var(--chair-border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.percentage}%`, background: item.color, borderRadius: '3px' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '10px', background: 'var(--chair-bg)', fontSize: '12px', color: 'var(--chair-muted)', textAlign: 'center' }}>
            Hybrid clinical delivery model supported: In-person hospital consultations supplemented by remote digital tele-triage.
          </div>
        </div>
      </div>
    </div>
  );
}
