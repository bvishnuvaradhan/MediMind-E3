import { useState } from 'react';
import {
  TrendingUp,
  Activity,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Video,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';

export function HospitalAnalyticsView({ analytics = {}, hospital = {} }) {
  const [period, setPeriod] = useState('CURRENT_MONTH');

  const kpis = analytics.kpis || {};
  const monthlyTrends = analytics.monthlyTrends || [
    { month: 'May 2026', appointments: 92, completed: 78, cancelled: 4, aiUsage: 64 },
    { month: 'Jun 2026', appointments: 104, completed: 88, cancelled: 5, aiUsage: 73 },
    { month: 'Jul 2026', appointments: 115, completed: 96, cancelled: 6, aiUsage: 81 },
    { month: 'Aug 2026', appointments: 122, completed: 101, cancelled: 5, aiUsage: 86 },
    { month: 'Sep 2026', appointments: 128, completed: 104, cancelled: 6, aiUsage: 91 },
  ];

  const totalBeds = Number(hospital.totalBeds) || 250;
  const occupiedBeds = Number(hospital.occupiedBeds) || 210;
  const occupancyRate = `${Math.round((occupiedBeds / totalBeds) * 100)}%`;

  const totalAppts = kpis.totalAppointments || 128;
  const completedAppts = kpis.completedConsultations || 104;
  const scheduledAppts = 18;
  const cancelledAppts = 6;
  const completionRate = Math.round((completedAppts / totalAppts) * 100);
  const noShowRate = ((cancelledAppts / totalAppts) * 100).toFixed(1);

  // Weekly operational volume distribution (Mon - Sat)
  const weeklyData = [
    { day: 'Mon', scheduled: 24, completed: 22, cancelled: 1 },
    { day: 'Tue', scheduled: 26, completed: 23, cancelled: 1 },
    { day: 'Wed', scheduled: 22, completed: 19, cancelled: 2 },
    { day: 'Thu', scheduled: 25, completed: 21, cancelled: 1 },
    { day: 'Fri', scheduled: 20, completed: 14, cancelled: 1 },
    { day: 'Sat', scheduled: 11, completed: 5, cancelled: 0 },
  ];

  return (
    <div>
      {/* Header */}
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <TrendingUp size={24} />
          </div>
          <div>
            <h1>Hospital Operational Analytics</h1>
            <p>Hospital-wide operational overview, appointment throughput, consultation resolution, and monthly volume trends</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--ha-teal)' }} />
          <span>Hospital Operational Overview · Zero PHI Access</span>
        </div>
      </div>

      {/* Time Window Selector Bar */}
      <div className="ha-filter-bar" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--ha-primary)' }}>
          <Calendar size={16} />
          <span>Operational Period:</span>
        </div>

        <div className="ha-filter-pills">
          <button
            className={`ha-filter-pill ${period === 'CURRENT_MONTH' ? 'active' : ''}`}
            onClick={() => setPeriod('CURRENT_MONTH')}
          >
            Current Month (Sep 2026)
          </button>
          <button
            className={`ha-filter-pill ${period === 'LAST_MONTH' ? 'active' : ''}`}
            onClick={() => setPeriod('LAST_MONTH')}
          >
            Last Month (Aug 2026)
          </button>
          <button
            className={`ha-filter-pill ${period === 'Q3' ? 'active' : ''}`}
            onClick={() => setPeriod('Q3')}
          >
            Q3 2026 (Jul – Sep)
          </button>
          <button
            className={`ha-filter-pill ${period === 'YTD' ? 'active' : ''}`}
            onClick={() => setPeriod('YTD')}
          >
            Year-to-Date 2026
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="ha-stat-grid">
        <StatCard
          label="Total Hospital Bookings"
          value={totalAppts}
          subtext="Monthly volume (+4.9% vs Aug)"
          icon={Calendar}
          tone="primary"
          isPositive
        />
        <StatCard
          label="Completed Consultations"
          value={completedAppts}
          subtext={`${completionRate}% Hospital completion rate`}
          icon={CheckCircle}
          tone="teal"
          isPositive
        />
        <StatCard
          label="Scheduled & In-Queue"
          value={scheduledAppts}
          subtext="14 active consultations today"
          icon={Clock}
          tone="indigo"
        />
        <StatCard
          label="Cancellation & No-Show"
          value={`${noShowRate}%`}
          subtext={`${cancelledAppts} total cancelled bookings`}
          icon={AlertCircle}
          tone="warning"
        />
      </div>

      {/* 2-Column Section: Retrospective Growth + Weekly Operational Flow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Monthly Retrospective Volume Trends */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Monthly Operational Volume Trends (May – Sep 2026)</h3>
              <p>Five-month progression of scheduled intake and completed consultations</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ha-text-muted)' }}>
              <TrendingUp size={14} style={{ color: 'var(--ha-primary)' }} />
              <span>Throughput</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {monthlyTrends.map((item) => {
              const rate = Math.round((item.completed / item.appointments) * 100);
              return (
                <div
                  key={item.month}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ha-bg)',
                    border: '1px solid var(--ha-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ha-text-muted)', textTransform: 'uppercase' }}>
                    {item.month.split(' ')[0]}
                  </span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
                    {item.appointments}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--ha-teal)', fontWeight: 600 }}>
                    {item.completed} ({rate}%)
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Bar Progression */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '140px', paddingTop: '16px', paddingBottom: '8px', gap: '10px' }}>
            {monthlyTrends.map((item) => {
              const heightPct = Math.round((item.appointments / 140) * 100);
              const completedHeightPct = Math.round((item.completed / item.appointments) * 100);

              return (
                <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--ha-text-primary)' }}>
                    {item.completed}
                  </span>

                  <div
                    style={{
                      width: '100%',
                      maxWidth: '36px',
                      height: `${heightPct}%`,
                      backgroundColor: 'var(--ha-soft-bg)',
                      border: '1px solid var(--ha-border)',
                      borderRadius: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      overflow: 'hidden',
                    }}
                    title={`${item.month}: ${item.completed} of ${item.appointments} completed`}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${completedHeightPct}%`,
                        backgroundColor: 'var(--ha-primary)',
                        borderRadius: '0 0 5px 5px',
                      }}
                    />
                  </div>

                  <span style={{ fontSize: '10px', color: 'var(--ha-text-muted)', fontWeight: 600 }}>
                    {item.month.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly OPD Operational Flow */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Weekly OPD Operational Flow</h3>
              <p>Daily appointment volume distribution (Monday – Saturday)</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ha-text-muted)' }}>
              <BarChart3 size={14} style={{ color: 'var(--ha-teal)' }} />
              <span>Daily Volume</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingTop: '20px', paddingBottom: '10px', gap: '12px' }}>
            {weeklyData.map((item) => {
              const heightPct = Math.round((item.scheduled / 30) * 100);
              const completedHeightPct = Math.round((item.completed / item.scheduled) * 100);

              return (
                <div key={item.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ha-text-primary)' }}>
                    {item.completed}
                  </span>

                  <div
                    style={{
                      width: '100%',
                      maxWidth: '38px',
                      height: `${heightPct}%`,
                      backgroundColor: 'var(--ha-soft-bg)',
                      border: '1px solid var(--ha-border)',
                      borderRadius: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      overflow: 'hidden',
                    }}
                    title={`${item.day}: ${item.completed} completed of ${item.scheduled} scheduled`}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${completedHeightPct}%`,
                        backgroundColor: 'var(--ha-teal)',
                        borderRadius: '0 0 5px 5px',
                      }}
                    />
                  </div>

                  <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', fontWeight: 600 }}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '11px', color: 'var(--ha-text-muted)', paddingTop: '12px', borderTop: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--ha-teal)', borderRadius: '2px' }} />
              <span>Completed Consultations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)', borderRadius: '2px' }} />
              <span>Scheduled Capacity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hospital Infrastructure & Consultation Modalities */}
      <div className="ha-card-panel">
        <div className="ha-card-panel-header">
          <div>
            <h3>Hospital Operational Modalities & Infrastructure Capacity</h3>
            <p>Intake channel breakdown, peak scheduling windows, and institution-level bed occupancy</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-primary)', marginBottom: '6px' }}>
              <Building2 size={16} />
              <strong style={{ fontSize: '12px' }}>In-Person Physical Consultations</strong>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
              78% <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ha-text-muted)' }}>(100 Bookings)</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>Hospital consultation suites</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-teal)', marginBottom: '6px' }}>
              <Video size={16} />
              <strong style={{ fontSize: '12px' }}>Telehealth & Remote Video</strong>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
              22% <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ha-text-muted)' }}>(28 Bookings)</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>Encrypted remote consultations</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-indigo)', marginBottom: '6px' }}>
              <Activity size={16} />
              <strong style={{ fontSize: '12px' }}>Hospital Bed Occupancy</strong>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
              {occupancyRate}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>{occupiedBeds} of {totalBeds} total beds occupied</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-warning)', marginBottom: '6px' }}>
              <Clock size={16} />
              <strong style={{ fontSize: '12px' }}>Peak Intake Window</strong>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
              09:00 AM – 12:00 PM
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>54% of hospital patient volume</span>
          </div>
        </div>
      </div>

      {/* Aggregate Retrospective Performance Summary */}
      <div className="ha-card-panel">
        <div className="ha-card-panel-header">
          <div>
            <h3>Monthly Operational Performance Summary Table</h3>
            <p>Retrospective hospital-level operational metrics across all clinical units</p>
          </div>
        </div>

        <div className="ha-table-container">
          <table className="ha-table">
            <thead>
              <tr>
                <th>Operational Period</th>
                <th>Total Bookings</th>
                <th>Completed Consultations</th>
                <th>Completion Rate</th>
                <th>Cancelled Bookings</th>
                <th>No-Show Rate</th>
                <th>AI Triaged Scans</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrends.map((item) => {
                const rate = Math.round((item.completed / item.appointments) * 100);
                const cancelled = item.cancelled || (item.appointments - item.completed - 6 > 0 ? item.appointments - item.completed - 6 : 4);
                const cRate = ((cancelled / item.appointments) * 100).toFixed(1);

                return (
                  <tr key={item.month}>
                    <td>
                      <strong style={{ fontSize: '13px', color: 'var(--ha-text-primary)' }}>{item.month}</strong>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px' }}>{item.appointments}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ha-teal)' }}>{item.completed}</span>
                    </td>
                    <td>
                      <span className="ha-badge success">{rate}%</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-text-secondary)' }}>{cancelled}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-warning)' }}>{cRate}%</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-primary)' }}>{item.aiUsage} Scans</span>
                    </td>
                    <td>
                      <span className="ha-badge info" style={{ fontSize: '10px' }}>Closed Cycle</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
