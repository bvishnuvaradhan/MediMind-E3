import { useState } from 'react';
import {
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Building2,
  AlertCircle,
  Video,
  UserCheck,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';

export function AppointmentsView({ appointments = [], departments = [] }) {
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('MONTH');
  const [search, setSearch] = useState('');

  // Operational aggregate calculations
  const totalAppointments = appointments.length || 128;
  const completedAppointments = appointments.filter((a) => a.status === 'Completed').length || 104;
  const scheduledAppointments = appointments.filter((a) => a.status === 'Scheduled' || a.status === 'In-Progress').length || 18;
  const cancelledAppointments = appointments.filter((a) => a.status === 'Cancelled').length || 6;
  const completionRate = Math.round((completedAppointments / totalAppointments) * 100);
  const cancellationRate = ((cancelledAppointments / totalAppointments) * 100).toFixed(1);

  // Department-level aggregate summaries
  const departmentSummaries = departments.map((dept) => {
    const deptAppts = appointments.filter((a) => a.departmentId === dept.id);
    const scheduled = dept.activeAppointments || deptAppts.length || 40;
    const completed = dept.completedConsultations || deptAppts.filter((a) => a.status === 'Completed').length || 35;
    const cancelled = deptAppts.filter((a) => a.status === 'Cancelled').length || 2;
    const rate = Math.round((completed / scheduled) * 100);
    const utilization = dept.bedOccupancy || '82%';
    const aiTriaged = dept.aiPredictionsCount || 30;

    return {
      id: dept.id,
      name: dept.name,
      code: dept.code,
      headName: dept.headName,
      doctorsCount: dept.doctorsCount,
      scheduled,
      completed,
      cancelled,
      rate,
      utilization,
      aiTriaged,
    };
  });

  const filteredDeptSummaries = departmentSummaries.filter((d) => {
    const matchesDept = deptFilter === 'ALL' || d.id === deptFilter;
    const matchesSearch =
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.headName.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Weekly operational trend distribution
  const weeklyTrends = [
    { day: 'Mon', scheduled: 24, completed: 22, cancelled: 1 },
    { day: 'Tue', scheduled: 26, completed: 23, cancelled: 1 },
    { day: 'Wed', scheduled: 22, completed: 19, cancelled: 2 },
    { day: 'Thu', scheduled: 25, completed: 21, cancelled: 1 },
    { day: 'Fri', scheduled: 20, completed: 14, cancelled: 1 },
    { day: 'Sat', scheduled: 11, completed: 5, cancelled: 0 },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <Calendar size={24} />
          </div>
          <div>
            <h1>Hospital OPD & Appointment Analytics</h1>
            <p>Aggregate operational appointment volume, department utilization, scheduling efficiency, and throughput trends</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-text-muted)', backgroundColor: 'var(--ha-card)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--ha-border)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--ha-teal)' }} />
          <span>Aggregate Operational Metrics Only · Zero PHI Access</span>
        </div>
      </div>

      {/* Aggregate KPI Grid */}
      <div className="ha-stat-grid">
        <StatCard
          label="Total OPD Volume"
          value={totalAppointments}
          subtext="Total scheduled bookings this month"
          icon={Calendar}
          tone="primary"
        />
        <StatCard
          label="Completed Consultations"
          value={completedAppointments}
          subtext={`${completionRate}% Hospital-wide completion rate`}
          icon={CheckCircle2}
          tone="teal"
          isPositive
        />
        <StatCard
          label="Active / In-Queue"
          value={scheduledAppointments}
          subtext="14 consultations today"
          icon={Clock}
          tone="indigo"
        />
        <StatCard
          label="Cancellation & No-Show"
          value={`${cancellationRate}%`}
          subtext={`${cancelledAppointments} total cancelled bookings`}
          icon={AlertCircle}
          tone="warning"
        />
      </div>

      {/* Filter and Time Range Bar */}
      <div className="ha-filter-bar">
        <div className="ha-search-box" style={{ width: '280px' }}>
          <Search size={15} style={{ color: 'var(--ha-text-muted)' }} />
          <input
            placeholder="Search department, head doctor, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ha-filter-pills">
          <button
            className={`ha-filter-pill ${deptFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setDeptFilter('ALL')}
          >
            All Departments ({departments.length})
          </button>
          {departments.map((d) => (
            <button
              key={d.id}
              className={`ha-filter-pill ${deptFilter === d.id ? 'active' : ''}`}
              onClick={() => setDeptFilter(d.id)}
            >
              {d.name.split(' ')[0]}
            </button>
          ))}
        </div>

        <select
          className="ha-select"
          style={{ width: 'auto', minWidth: '160px', padding: '6px 12px', fontSize: '12px' }}
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
        >
          <option value="MONTH">Current Month (Sep 2026)</option>
          <option value="30DAYS">Last 30 Days (Rolling)</option>
          <option value="QUARTER">Q3 2026</option>
          <option value="TODAY">Today's Intake (24 Sep)</option>
        </select>
      </div>

      {/* 2-Column Analytics: Department Breakdown + Weekly Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Department Volume & Completion Breakdown */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Department OPD Volume & Completion</h3>
              <p>Scheduled vs completed consultations by clinical unit</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ha-text-muted)' }}>
              <TrendingUp size={14} style={{ color: 'var(--ha-primary)' }} />
              <span>Throughput</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {departmentSummaries.map((dept) => (
              <div key={dept.id} style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--ha-text-primary)' }}>{dept.name}</strong>
                    <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', marginLeft: '8px' }}>
                      Head: {dept.headName}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ha-primary)' }}>
                      {dept.completed} / {dept.scheduled} Consultations
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', marginLeft: '6px' }}>
                      ({dept.rate}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--ha-border)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${dept.rate}%`,
                      height: '100%',
                      backgroundColor: 'var(--ha-teal)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ha-text-muted)', marginTop: '8px' }}>
                  <span>Bed / Clinic Utilization: <strong>{dept.utilization}</strong></span>
                  <span>AI Screening Pipeline Triaged: <strong>{dept.aiTriaged} cases</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly OPD Operational Trend */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Weekly OPD Operational Throughput</h3>
              <p>Daily appointment volume distribution (Monday – Saturday)</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ha-text-muted)' }}>
              <BarChart3 size={14} style={{ color: 'var(--ha-teal)' }} />
              <span>Daily Volume</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingTop: '20px', paddingBottom: '10px', gap: '12px' }}>
            {weeklyTrends.map((item) => {
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
                        backgroundColor: 'var(--ha-primary)',
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
              <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--ha-primary)', borderRadius: '2px' }} />
              <span>Completed Consultations</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)', borderRadius: '2px' }} />
              <span>Total Scheduled Slot Capacity</span>
            </div>
          </div>
        </div>
      </div>

      {/* Consultation Intake Channels & Slot Breakdown */}
      <div className="ha-card-panel">
        <div className="ha-card-panel-header">
          <div>
            <h3>Consultation Channels & Time Slot Distribution</h3>
            <p>Operational intake modalities and peak clinical load windows</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-primary)', marginBottom: '6px' }}>
              <Building2 size={16} />
              <strong style={{ fontSize: '12px' }}>In-Person Physical OPD</strong>
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
            <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>Encrypted remote follow-ups</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-indigo)', marginBottom: '6px' }}>
              <Clock size={16} />
              <strong style={{ fontSize: '12px' }}>Peak Intake Window</strong>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
              09:00 AM – 12:00 PM
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>54% of daily patient traffic</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-warning)', marginBottom: '6px' }}>
              <UserCheck size={16} />
              <strong style={{ fontSize: '12px' }}>Afternoon Window</strong>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
              02:00 PM – 05:00 PM
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>38% of daily patient traffic</span>
          </div>
        </div>
      </div>

      {/* Department Operational Summary Table (Aggregate Only - Zero Patient Rows) */}
      <div className="ha-card-panel">
        <div className="ha-card-panel-header">
          <div>
            <h3>Department Operational Summary Table</h3>
            <p>Aggregate department throughput, completion benchmarks, and utilization</p>
          </div>
        </div>

        <div className="ha-table-container">
          <table className="ha-table">
            <thead>
              <tr>
                <th>Department & Code</th>
                <th>Department Head</th>
                <th>Staff Doctors</th>
                <th>Scheduled Bookings</th>
                <th>Completed Consultations</th>
                <th>Completion Rate</th>
                <th>Bed / Clinic Utilization</th>
                <th>AI Triaged Volume</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeptSummaries.map((dept) => (
                <tr key={dept.id}>
                  <td>
                    <div>
                      <strong style={{ fontSize: '13px', display: 'block', color: 'var(--ha-text-primary)' }}>{dept.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--ha-primary)', fontWeight: 700 }}>CODE: {dept.code}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ha-text-primary)' }}>{dept.headName}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--ha-text-secondary)' }}>{dept.doctorsCount} Doctors</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '13px', color: 'var(--ha-text-primary)' }}>{dept.scheduled}</strong>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ha-teal)' }}>{dept.completed}</span>
                  </td>
                  <td>
                    <span className="ha-badge success" style={{ fontSize: '11px' }}>
                      {dept.rate}%
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ha-indigo)' }}>
                      {dept.utilization}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '12px', color: 'var(--ha-text-secondary)' }}>
                      {dept.aiTriaged} Cases
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
