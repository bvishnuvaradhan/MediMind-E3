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
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { chairmanService } from '../../../services/chairmanService';
import { LineChart, BarChart, DonutChart } from '../../common/charts';

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

      {/* Two Column Grid: Historical Trend LineChart + Resolution Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px', marginBottom: '28px' }}>
        
        {/* Historical Monthly Volume Trend LineChart */}
        <div className="table-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontFamily: 'Plus Jakarta Sans' }}>
                Historical Monthly Volume Trend
              </h3>
              <p style={{ margin: 0, color: 'var(--chair-muted)', fontSize: '12px' }}>
                5-month platform appointment growth trajectory (May – Sep 2026)
              </p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <ArrowUpRight size={13} /> +106% 5-mo growth
            </span>
          </div>

          <LineChart
            data={analytics.historicalMonthlyTrends.map((t) => ({
              label: t.month.split(' ')[0],
              volume: t.volume,
              completed: t.completed,
              scheduled: t.scheduled,
            }))}
            xKey="label"
            height={220}
            yAxisLabel="Consultations"
            series={[
              { key: 'volume', name: 'Total Volume', color: '#2563eb', area: true, fillOpacity: 0.18 },
              { key: 'completed', name: 'Completed Cases', color: '#0f766e', area: true, fillOpacity: 0.12 },
              { key: 'scheduled', name: 'Scheduled', color: '#f59e0b' },
            ]}
          />

          <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '10px', background: 'var(--chair-bg)', fontSize: '12px', color: 'var(--chair-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span><b>May 2026 Baseline:</b> 62 visits</span>
            <span><b>Sep 2026 Current:</b> 128 visits (+66 net gain)</span>
          </div>
        </div>

        {/* Operational Status & Fulfillment Breakdown */}
        <div className="table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
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
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--chair-indigo-soft)', fontSize: '12px', color: 'var(--chair-indigo)' }}>
            <b>Fulfillment Integrity:</b> 93.8% of scheduled encounters result in completed clinical consultations with minimal network cancellations.
          </div>
        </div>
      </div>

      {/* Two Column Grid: Department Throughput BarChart + Modality Distribution DonutChart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '22px', marginBottom: '28px' }}>
        
        {/* Department Throughput Breakdown BarChart */}
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

          <BarChart
            data={analytics.departmentThroughput.map((d) => ({
              label: d.department.includes('&') ? d.department.split('&')[0].trim() : d.department,
              visits: d.count,
            }))}
            xKey="label"
            height={210}
            yAxisLabel="Visits"
            series={[
              { key: 'visits', name: 'Consultations', color: '#4338ca' },
            ]}
          />
        </div>

        {/* Consultation Modality Distribution DonutChart */}
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
            <DonutChart
              data={analytics.consultationModeDistribution.map((item) => ({
                label: item.mode,
                value: item.count,
                color: item.color,
              }))}
              size={170}
              innerRadius={48}
              outerRadius={75}
              centerValue={`${analytics.currentMonthVolume}`}
              centerLabel="Visits"
            />
          </div>

          <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'var(--chair-bg)', fontSize: '12px', color: 'var(--chair-muted)', textAlign: 'center' }}>
            Hybrid clinical delivery model supported: In-person hospital consultations supplemented by remote digital tele-triage.
          </div>
        </div>
      </div>
    </div>
  );
}

