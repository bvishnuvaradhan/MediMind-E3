import { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import {
  LineChart,
  BarChart,
  HeatmapChart,
  DonutChart,
  BulletChart,
} from '../../common/charts';

export function HospitalAnalyticsView({ analytics = {}, hospital = {} }) {
  const [period, setPeriod] = useState('CURRENT_MONTH');

  const totalBeds = Number(hospital.totalBeds) || 250;

  // Period-based dynamic calculation
  const periodData = {
    CURRENT_MONTH: {
      label: 'Current Month (Sep 2026)',
      totalAppts: 128,
      completedAppts: 104,
      scheduledAppts: 18,
      cancelledAppts: 6,
      subtextDelta: 'Monthly volume (+4.9% vs Aug)',
      occupiedBeds: 210,
      inPerson: 100,
      video: 28,
      weeklyData: [
        { day: 'Mon', scheduled: 24, completed: 22, cancelled: 1 },
        { day: 'Tue', scheduled: 26, completed: 23, cancelled: 1 },
        { day: 'Wed', scheduled: 22, completed: 19, cancelled: 2 },
        { day: 'Thu', scheduled: 25, completed: 21, cancelled: 1 },
        { day: 'Fri', scheduled: 20, completed: 14, cancelled: 1 },
        { day: 'Sat', scheduled: 11, completed: 5, cancelled: 0 },
      ],
    },
    LAST_MONTH: {
      label: 'Last Month (Aug 2026)',
      totalAppts: 122,
      completedAppts: 101,
      scheduledAppts: 16,
      cancelledAppts: 5,
      subtextDelta: 'Monthly volume (+6.1% vs Jul)',
      occupiedBeds: 202,
      inPerson: 96,
      video: 26,
      weeklyData: [
        { day: 'Mon', scheduled: 23, completed: 21, cancelled: 1 },
        { day: 'Tue', scheduled: 25, completed: 22, cancelled: 1 },
        { day: 'Wed', scheduled: 21, completed: 18, cancelled: 1 },
        { day: 'Thu', scheduled: 24, completed: 20, cancelled: 1 },
        { day: 'Fri', scheduled: 19, completed: 15, cancelled: 1 },
        { day: 'Sat', scheduled: 10, completed: 5, cancelled: 0 },
      ],
    },
    Q3: {
      label: 'Q3 2026 (Jul – Sep)',
      totalAppts: 365,
      completedAppts: 301,
      scheduledAppts: 48,
      cancelledAppts: 16,
      subtextDelta: 'Quarterly aggregate volume (+18.2% vs Q2)',
      occupiedBeds: 208,
      inPerson: 287,
      video: 78,
      weeklyData: [
        { day: 'Mon', scheduled: 70, completed: 64, cancelled: 3 },
        { day: 'Tue', scheduled: 75, completed: 67, cancelled: 3 },
        { day: 'Wed', scheduled: 64, completed: 56, cancelled: 4 },
        { day: 'Thu', scheduled: 72, completed: 62, cancelled: 3 },
        { day: 'Fri', scheduled: 58, completed: 44, cancelled: 3 },
        { day: 'Sat', scheduled: 31, completed: 15, cancelled: 0 },
      ],
    },
    YTD: {
      label: 'Year-to-Date 2026',
      totalAppts: 980,
      completedAppts: 824,
      scheduledAppts: 112,
      cancelledAppts: 44,
      subtextDelta: '9-Month operational throughput',
      occupiedBeds: 205,
      inPerson: 774,
      video: 206,
      weeklyData: [
        { day: 'Mon', scheduled: 185, completed: 170, cancelled: 8 },
        { day: 'Tue', scheduled: 198, completed: 178, cancelled: 9 },
        { day: 'Wed', scheduled: 172, completed: 150, cancelled: 10 },
        { day: 'Thu', scheduled: 190, completed: 165, cancelled: 8 },
        { day: 'Fri', scheduled: 155, completed: 120, cancelled: 7 },
        { day: 'Sat', scheduled: 80, completed: 41, cancelled: 2 },
      ],
    },
  };

  const currentMetrics = periodData[period] || periodData.CURRENT_MONTH;
  const totalAppts = currentMetrics.totalAppts;
  const completedAppts = currentMetrics.completedAppts;
  const scheduledAppts = currentMetrics.scheduledAppts;
  const cancelledAppts = currentMetrics.cancelledAppts;
  const occupiedBeds = currentMetrics.occupiedBeds;
  const completionRate = Math.round((completedAppts / totalAppts) * 100);
  const noShowRate = ((cancelledAppts / totalAppts) * 100).toFixed(1);
  const weeklyData = currentMetrics.weeklyData;

  const monthlyTrends = analytics.monthlyTrends || [
    { month: 'May 2026', appointments: 92, completed: 78, cancelled: 4, aiUsage: 64 },
    { month: 'Jun 2026', appointments: 104, completed: 88, cancelled: 5, aiUsage: 73 },
    { month: 'Jul 2026', appointments: 115, completed: 96, cancelled: 6, aiUsage: 81 },
    { month: 'Aug 2026', appointments: 122, completed: 101, cancelled: 5, aiUsage: 86 },
    { month: 'Sep 2026', appointments: 128, completed: 104, cancelled: 6, aiUsage: 91 },
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

      {/* 2-Column Section: 5-Month Trajectory Line Chart + Weekly OPD Grouped Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Monthly Retrospective Volume Trends Line Chart */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Monthly Operational Volume Trends (May – Sep 2026)</h3>
              <p>Five-month trajectory of scheduled intake and completed consultations</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ha-text-muted)' }}>
              <TrendingUp size={14} style={{ color: 'var(--ha-primary)' }} />
              <span>Throughput</span>
            </div>
          </div>

          <LineChart
            data={monthlyTrends.map((m) => ({
              label: m.month.split(' ')[0],
              appointments: m.appointments,
              completed: m.completed,
              aiUsage: m.aiUsage,
            }))}
            xKey="label"
            height={200}
            yAxisLabel="Consultations"
            series={[
              { key: 'appointments', name: 'Intake Bookings', color: '#2563eb', area: true, fillOpacity: 0.18 },
              { key: 'completed', name: 'Completed Cases', color: '#0f766e', area: true, fillOpacity: 0.12 },
              { key: 'aiUsage', name: 'AI Screened', color: '#7c3aed' },
            ]}
          />
        </div>

        {/* Weekly OPD Operational Flow Grouped Bar Chart */}
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

          <BarChart
            data={weeklyData.map((w) => ({
              label: w.day,
              scheduled: w.scheduled,
              completed: w.completed,
            }))}
            xKey="label"
            height={200}
            yAxisLabel="Daily Volume"
            series={[
              { key: 'scheduled', name: 'Scheduled Capacity', color: '#93c5fd' },
              { key: 'completed', name: 'Completed Consultations', color: '#0f766e' },
            ]}
          />
        </div>
      </div>

      {/* 2-Column Section: OPD Hourly Peak Heatmap + Modality / Bed Capacity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* OPD Peak Hours Activity Heatmap */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>OPD Clinic Peak Activity Heatmap</h3>
              <p>Consultation density matrix by day of week and operational time window</p>
            </div>
          </div>

          <HeatmapChart
            xLabels={['9 AM', '11 AM', '1 PM', '3 PM', '5 PM']}
            yLabels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
            matrix={[
              [6, 8, 4, 7, 3], // Mon
              [7, 9, 5, 8, 2], // Tue
              [5, 7, 3, 6, 4], // Wed
              [6, 9, 4, 7, 3], // Thu
              [4, 6, 3, 5, 2], // Fri
              [3, 5, 2, 1, 0], // Sat
            ]}
            color="#2563eb"
            height={190}
          />
        </div>

        {/* Modality Donut + Bed Capacity Bullet Chart */}
        <div className="ha-card-panel" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Care Modality Mix & Inpatient Capacity</h3>
              <p>Consultation channel distribution and facility bed occupancy benchmarks</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap', gap: '16px' }}>
            <DonutChart
              data={[
                { label: 'In-Person OPD', value: currentMetrics.inPerson, color: '#2563eb' },
                { label: 'Telehealth Video', value: currentMetrics.video, color: '#0f766e' },
              ]}
              size={140}
              innerRadius={38}
              outerRadius={58}
              centerValue={`${totalAppts}`}
              centerLabel="Total Visits"
            />

            <div style={{ flex: 1, minWidth: '180px' }}>
              <BulletChart
                title="Hospital Inpatient Bed Occupancy"
                subtitle={`${occupiedBeds} of ${totalBeds} beds occupied`}
                actual={Math.round((occupiedBeds / totalBeds) * 100)}
                target={85}
                max={100}
                unit="%"
                ranges={[60, 85, 100]}
                color="#0f766e"
              />
            </div>
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
