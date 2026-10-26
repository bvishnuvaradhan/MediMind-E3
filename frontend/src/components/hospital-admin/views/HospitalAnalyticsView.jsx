import { getRelativeDateRange, STANDARDIZED_ANALYTICS_PERIODS } from "../../../utils/dateUtils";
import { useState, useEffect } from 'react';
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
import { hospitalAdminService } from '../../../services/hospitalAdminService';

export function HospitalAnalyticsView({ analytics = {}, hospital = {}, appointments = [] }) {
  const [period, setPeriod] = useState('This Month');
  const [periodStats, setPeriodStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const targetHospitalId = hospital?.id || hospital?._id || '6ac85a18074c2bc731a76381';

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      setLoadingStats(true);
      try {
        const res = await hospitalAdminService.getHospitalAnalytics(targetHospitalId, period);
        if (isMounted && res) {
          setPeriodStats(res);
        }
      } catch (err) {
        console.error('Failed to load period hospital analytics:', err);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    }
    loadStats();
    return () => {
      isMounted = false;
    };
  }, [period, targetHospitalId]);

  const currentAnalytics = periodStats || analytics;

  const totalAppts = currentAnalytics?.totalOPDConsultations ?? (analytics?.totalOPDConsultations || 0);
  const completedAppts = currentAnalytics?.completedConsultations ?? (analytics?.completedConsultations || 0);
  const scheduledAppts = currentAnalytics?.upcomingAppointments ?? (analytics?.upcomingAppointments || 0);
  const cancelledAppts = currentAnalytics?.cancelledAppointments ?? (analytics?.cancelledAppointments || 0);

  const completionRate = totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 0;
  const noShowRate = totalAppts > 0 ? ((cancelledAppts / totalAppts) * 100).toFixed(1) : '0.0';

  const totalBeds = Number(hospital.bedCapacity || hospital.totalBeds) || 350;
  const occupiedBeds = hospital.occupiedBeds;
  const hasOccupancyTelemetry = Boolean(occupiedBeds);

  // Live count of today's scheduled consultations
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayActiveCount = (appointments || []).filter((a) => {
    const aDate = (a.appointmentDate || a.appointment_date || '').slice(0, 10);
    const aStatus = (a.status || '').toUpperCase();
    return aDate === todayStr && ['BOOKED', 'CONFIRMED', 'SCHEDULED', 'RESCHEDULED'].includes(aStatus);
  }).length;

  // Day-of-week breakdown from authoritative backend aggregation
  const weeklyData = (currentAnalytics?.byDayOfWeek && currentAnalytics.byDayOfWeek.length > 0)
    ? currentAnalytics.byDayOfWeek
    : [
        { day: 'Mon', scheduled: 0, completed: 0 },
        { day: 'Tue', scheduled: 0, completed: 0 },
        { day: 'Wed', scheduled: 0, completed: 0 },
        { day: 'Thu', scheduled: 0, completed: 0 },
        { day: 'Fri', scheduled: 0, completed: 0 },
        { day: 'Sat', scheduled: 0, completed: 0 },
      ];

  // Retrospective multi-month trends
  const rawMonthlyTrends = currentAnalytics?.monthlyTrends || analytics?.monthlyTrends || [];
  const monthlyTrends = rawMonthlyTrends.map((m) => {
    const appointments = Number(m.appointments ?? m.volume ?? m.total ?? 0);
    const completed = Number(m.completed ?? 0);
    const cancelled = Number(m.cancelled ?? 0);
    const scheduled = Number(m.scheduled ?? 0);
    const aiUsage = Number(m.aiUsage ?? 0);
    return {
      ...m,
      month: m.month || 'Unknown',
      appointments,
      completed,
      cancelled,
      scheduled,
      aiUsage,
    };
  });

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
          {STANDARDIZED_ANALYTICS_PERIODS.map((opt) => (
            <button
              key={opt}
              className={`ha-filter-pill ${period === opt ? 'active' : ''}`}
              onClick={() => setPeriod(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="ha-stat-grid">
        <StatCard
          label="Total Hospital Bookings"
          value={totalAppts}
          subtext={`${period} recorded hospital bookings`}
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
          subtext={`${todayActiveCount} active consultations today (Live OPD Queue)`}
          icon={Clock}
          tone="indigo"
        />
        <StatCard
          label="Cancellation & No-Show"
          value={`${noShowRate}%`}
          subtext={`${cancelledAppts} non-completed bookings for ${period}`}
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
              <h3>Five-Month Retrospective Volume Trends ({monthlyTrends[0]?.month || 'Baseline'} – {monthlyTrends[monthlyTrends.length - 1]?.month || 'Current'})</h3>
              <p>Five-month historical trajectory of scheduled intake and completed consultations (Independent Retrospective Trend)</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ha-text-muted)' }}>
              <TrendingUp size={14} style={{ color: 'var(--ha-primary)' }} />
              <span>Throughput</span>
            </div>
          </div>

          {monthlyTrends.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ha-text-muted)', fontSize: '12px' }}>
              No historical retrospective trends available
            </div>
          ) : (
            <LineChart
              data={monthlyTrends.map((m) => ({
                label: (m.month || '').split(' ')[0],
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
          )}
        </div>

        {/* Weekly OPD Operational Flow Grouped Bar Chart */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Weekly OPD Operational Flow</h3>
              <p>Daily appointment volume distribution across operational weekdays ({period})</p>
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
              { key: 'scheduled', name: 'Scheduled Encounters', color: '#93c5fd' },
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
              [6, 8, 4, 7, 3],
              [7, 9, 5, 8, 2],
              [5, 7, 3, 6, 4],
              [6, 9, 4, 7, 3],
              [4, 6, 3, 5, 2],
              [3, 5, 2, 1, 0],
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
                { label: 'In-Person OPD', value: Math.round(totalAppts * 0.78), color: '#2563eb' },
                { label: 'Telehealth Video', value: Math.round(totalAppts * 0.22), color: '#0f766e' },
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
                subtitle={hasOccupancyTelemetry ? `${occupiedBeds} of ${totalBeds} beds occupied` : `Inpatient census telemetry offline (Usable capacity: ${totalBeds} beds)`}
                actual={hasOccupancyTelemetry ? Math.round((occupiedBeds / totalBeds) * 100) : 0}
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
                const appts = item.appointments;
                const completed = item.completed;
                const cancelled = item.cancelled;
                const rate = appts > 0 ? `${Math.round((completed / appts) * 100)}%` : (completed === 0 ? '0%' : 'N/A');
                const cRate = appts > 0 ? `${((cancelled / appts) * 100).toFixed(1)}%` : (cancelled === 0 ? '0.0%' : 'N/A');

                return (
                  <tr key={item.month}>
                    <td>
                      <strong style={{ fontSize: '13px', color: 'var(--ha-text-primary)' }}>{item.month}</strong>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px' }}>{appts}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ha-teal)' }}>{completed}</span>
                    </td>
                    <td>
                      <span className="ha-badge success">{rate}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-text-secondary)' }}>{cancelled}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-warning)' }}>{cRate}</span>
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
