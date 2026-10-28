import { getRelativeDateRange, STANDARDIZED_ANALYTICS_PERIODS, HOSPITAL_ADMIN_PERIOD_OPTIONS } from "../../../utils/dateUtils";
import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ShieldCheck,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import {
  LineChart,
  BarChart,
  HeatmapChart,
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

  const totalAiRuns = currentAnalytics?.totalAiPredictions ??
    currentAnalytics?.kpis?.totalAiPredictions ??
    currentAnalytics?.aiAggregateMetrics?.totalInferences ??
    currentAnalytics?.aiAggregateMetrics?.totalScans ??
    (currentAnalytics?.stats?.byHospitalPreds && currentAnalytics.stats.byHospitalPreds[targetHospitalId]) ??
    0;

  const completionRate = totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 0;
  const noShowRate = totalAppts > 0 ? ((cancelledAppts / totalAppts) * 100).toFixed(1) : '0.0';

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
    const rescheduled = Number(m.rescheduled ?? 0);
    const noShow = Number(m.noShow ?? 0);
    const walkIns = Number(m.walkIns ?? 0);
    const scheduled = Number(m.scheduled ?? 0);
    const aiUsage = Number(m.aiUsage ?? 0);
    const isFuture = Boolean(m.isFuture);
    const isCurrentMonth = Boolean(m.isCurrentMonth);
    const status = m.status || (isFuture ? 'Future Workload' : isCurrentMonth ? 'MTD In Progress' : 'Closed Cycle');
    return {
      ...m,
      month: m.month || 'Unknown',
      appointments,
      completed,
      cancelled,
      rescheduled,
      noShow,
      walkIns,
      scheduled,
      aiUsage,
      isFuture,
      isCurrentMonth,
      status,
    };
  });

  const totalTableBookings = monthlyTrends.reduce((sum, m) => sum + m.appointments, 0);
  const totalTableCompleted = monthlyTrends.reduce((sum, m) => sum + m.completed, 0);
  const totalTableCancelled = monthlyTrends.reduce((sum, m) => sum + m.cancelled, 0);
  const totalTableRescheduled = monthlyTrends.reduce((sum, m) => sum + m.rescheduled, 0);
  const totalTableNoShow = monthlyTrends.reduce((sum, m) => sum + m.noShow, 0);
  const totalTableWalkIns = monthlyTrends.reduce((sum, m) => sum + m.walkIns, 0);
  const totalTableAiScans = monthlyTrends.reduce((sum, m) => sum + m.aiUsage, 0);
  const tableCompletionRate = totalTableBookings > 0 ? ((totalTableCompleted / totalTableBookings) * 100).toFixed(1) + '%' : '0.0%';
  const tableNoShowRate = totalTableBookings > 0 ? ((totalTableNoShow / totalTableBookings) * 100).toFixed(1) + '%' : '0.0%';

  const hospName = hospital?.name || '';
  const defaultStartMonth = hospName.includes('Nexora')
    ? 'July 2026'
    : hospName.includes('Aarogyam')
    ? 'May 2026'
    : 'March 2026';
  const trendStartMonth = monthlyTrends[0]?.month || defaultStartMonth;
  const trendEndMonth = monthlyTrends[monthlyTrends.length - 1]?.month || 'Present';

  const periodOptions = HOSPITAL_ADMIN_PERIOD_OPTIONS || STANDARDIZED_ANALYTICS_PERIODS;

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
          {periodOptions.map((opt) => (
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

      {/* KPI Overview Grid (5 Responsive Cards) */}
      <div className="ha-stat-grid cols-5">
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
        <StatCard
          label="Clinical AI Runs"
          value={totalAiRuns}
          subtext={`${period} diagnostic AI triage inferences`}
          icon={Sparkles}
          tone="purple"
          isPositive
        />
      </div>

      {/* 2-Column Section: 5-Month Trajectory Line Chart + Weekly OPD Grouped Bar Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Monthly Retrospective Volume Trends Line Chart */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Historical Monthly Operational Volume Trends ({trendStartMonth} – {trendEndMonth})</h3>
              <p>Monthly booking intake, completed consultations, and clinical AI activity across the available reporting history</p>
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
                { key: 'completed', name: 'Completed Consultations', color: '#0f766e', area: true, fillOpacity: 0.12 },
                { key: 'aiUsage', name: 'Clinical AI Runs', color: '#7c3aed' },
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

      {/* OPD Clinic Peak Activity Heatmap */}
      <div className="ha-card-panel" style={{ marginBottom: '24px' }}>
        <div className="ha-card-panel-header">
          <div>
            <h3>OPD Clinic Peak Activity Heatmap</h3>
            <p>Consultation density matrix by day of week and operational time window ({period})</p>
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
                <th>Rescheduled Bookings</th>
                <th>No-Show Rate</th>
                <th>Walk-ins</th>
                <th>AI Triaged Scans</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrends.map((item) => {
                const appts = item.appointments;
                const completed = item.completed;
                const cancelled = item.cancelled;
                const rescheduled = item.rescheduled;
                const walkIns = item.walkIns;
                const rate = item.isFuture
                  ? 'N/A'
                  : appts > 0
                  ? `${((completed / appts) * 100).toFixed(1)}%`
                  : (completed === 0 ? '0.0%' : 'N/A');
                const noShowRate = item.isFuture
                  ? 'N/A'
                  : appts > 0
                  ? `${((item.noShow / appts) * 100).toFixed(1)}%`
                  : '0.0%';

                const badgeClass = item.isFuture
                  ? 'ha-badge warning'
                  : item.isCurrentMonth
                  ? 'ha-badge info'
                  : 'ha-badge success';

                return (
                  <tr key={item.month}>
                    <td>
                      <strong style={{ fontSize: '13px', color: 'var(--ha-text-primary)' }}>{item.month}</strong>
                    </td>
                    <td>
                      <strong style={{ fontSize: '13px' }}>{appts}</strong>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: item.isFuture ? 'var(--ha-text-muted)' : 'var(--ha-teal)' }}>
                        {item.isFuture ? '-' : completed}
                      </span>
                    </td>
                    <td>
                      <span className={item.isFuture ? 'ha-badge' : 'ha-badge success'}>{rate}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-text-secondary)' }}>{cancelled}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-primary)' }}>{rescheduled}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: item.isFuture ? 'var(--ha-text-muted)' : 'var(--ha-warning)' }}>
                        {noShowRate}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{walkIns}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--ha-primary)' }}>
                        {item.isFuture ? '-' : `${item.aiUsage} Scans`}
                      </span>
                    </td>
                    <td>
                      <span className={badgeClass} style={{ fontSize: '10px' }}>{item.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {monthlyTrends.length > 0 && (
              <tfoot>
                <tr style={{ fontWeight: 'bold', backgroundColor: 'var(--ha-table-header-bg, rgba(248, 250, 252, 0.9))', borderTop: '2px solid var(--ha-border)' }}>
                  <td>
                    <strong>TOTAL</strong>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13px' }}>{totalTableBookings}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ha-teal)' }}>{totalTableCompleted}</span>
                  </td>
                  <td>
                    <span className="ha-badge success">{tableCompletionRate}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px' }}>{totalTableCancelled}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--ha-primary)' }}>{totalTableRescheduled}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--ha-warning)' }}>{tableNoShowRate}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 700 }}>{totalTableWalkIns}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--ha-primary)', fontWeight: 700 }}>{totalTableAiScans} Scans</span>
                  </td>
                  <td>
                    <span className="ha-badge info" style={{ fontSize: '10px' }}>Facility Total</span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
