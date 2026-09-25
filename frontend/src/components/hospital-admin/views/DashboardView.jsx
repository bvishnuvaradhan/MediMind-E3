import {
  Building2,
  Users,
  Calendar,
  Sparkles,
  Activity,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Stethoscope,
  ChevronRight,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';

export function DashboardView({
  hospital,
  departments,
  departmentHeads,
  doctors,
  appointments,
  analytics,
  auditLogs = [],
  navigate,
  onOpenCreateHead,
  onOpenEditHospital,
}) {
  const kpis = analytics.kpis || {};
  const todayAppointments = appointments.filter((a) => a.date === '2026-09-24');

  const totalBeds = Number(hospital.totalBeds) || 250;
  const occupiedBeds = Number(hospital.occupiedBeds) || 210;
  const occupancyPct = Math.round((occupiedBeds / totalBeds) * 100);

  return (
    <div>
      {/* Welcome & Hospital Banner */}
      <div
        className="ha-card-panel"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #1e3a8a 50%, #0f766e 100%)',
          color: '#ffffff',
          border: 0,
          padding: '28px 32px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>🏥</span>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
                Hospital Administration Portal
              </span>
            </div>
            <h1 style={{ margin: '0 0 6px', fontFamily: 'Montserrat', fontSize: '26px', fontWeight: 800 }}>
              {hospital.name}
            </h1>
            <p style={{ margin: 0, fontSize: '13px', opacity: 0.85, maxWidth: '640px' }}>
              {hospital.address} · {hospital.accreditation} · {totalBeds} Beds ({occupancyPct}% Occupancy)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="ha-btn"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', backdropFilter: 'blur(4px)' }}
              onClick={onOpenEditHospital}
            >
              <Building2 size={15} />
              Hospital Profile
            </button>
            <button
              className="ha-btn"
              style={{ backgroundColor: '#ffffff', color: '#1e3a8a' }}
              onClick={onOpenCreateHead}
            >
              <Users size={15} />
              + Add Dept Head
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="ha-stat-grid">
        <StatCard
          label="Active Departments"
          value={departments.length}
          subtext="Orthopedics, Diabetology, Cardiology"
          icon={Building2}
          tone="primary"
        />
        <StatCard
          label="Total Clinical Staff"
          value={`${departmentHeads.length + doctors.length}`}
          subtext={`${departmentHeads.length} Heads · ${doctors.length} Staff Doctors`}
          icon={Users}
          tone="indigo"
        />
        <StatCard
          label="Today's Appointments"
          value={todayAppointments.length || 14}
          subtext="128 Total Bookings This Month"
          icon={Calendar}
          tone="teal"
          isPositive
        />
        <StatCard
          label="AI Predictions (Aggregate)"
          value={kpis.totalAiPredictions || 91}
          subtext="97.2% Diagnostic Assistance Rate"
          icon={Sparkles}
          tone="warning"
        />
      </div>

      {/* 2-Column Grid: Department Breakdown + Operational Today */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* Department Overview */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Department Oversight</h3>
              <p>Workload and doctor allocations across hospital departments</p>
            </div>
            <button
              className="ha-btn ha-btn-outline ha-btn-sm"
              onClick={() => navigate('Departments')}
            >
              View All <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {departments.map((dept) => (
              <div
                key={dept.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--ha-border)',
                  backgroundColor: 'var(--ha-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('Departments')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--ha-card)',
                      border: '1px solid var(--ha-border)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--ha-primary)',
                    }}
                  >
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', color: 'var(--ha-text-primary)' }}>
                      {dept.name}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>
                      Head: {dept.headName} · {dept.doctorsCount} Doctors · {dept.wardCapacity || 40} Beds
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="ha-badge success">{dept.status}</span>
                  <div style={{ fontSize: '11px', color: 'var(--ha-text-muted)', marginTop: '4px' }}>
                    {dept.activeAppointments} Active Appts
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Appointments Overview */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <div>
              <h3>Today's Hospital Appointments</h3>
              <p>Operational schedule & patient intake for {new Date().toLocaleDateString('en-GB')}</p>
            </div>
            <button
              className="ha-btn ha-btn-outline ha-btn-sm"
              onClick={() => navigate('Appointments')}
            >
              All Appts <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {todayAppointments.slice(0, 4).map((apt) => (
              <div
                key={apt.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--ha-border)',
                  backgroundColor: 'var(--ha-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--ha-soft-bg)',
                      color: 'var(--ha-primary)',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {apt.time}
                  </div>
                  <div>
                    <strong style={{ fontSize: '12px', display: 'block', color: 'var(--ha-text-primary)' }}>
                      {apt.doctorName} · {apt.department}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>
                      {apt.patientRef} · {apt.room}
                    </span>
                  </div>
                </div>

                <span className={`ha-badge ${apt.status.toLowerCase().replace(' ', '-')}`}>
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Highlights & AI Diagnostic Metrics */}
      <div className="ha-card-panel" style={{ marginBottom: '24px' }}>
        <div className="ha-card-panel-header">
          <div>
            <h3>Hospital Operational Performance</h3>
            <p>Throughput, consultation completion, and AI diagnostic utilization</p>
          </div>
          <button
            className="ha-btn ha-btn-secondary ha-btn-sm"
            onClick={() => navigate('Hospital Analytics')}
          >
            <TrendingUp size={14} /> Full Analytics
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-teal)', marginBottom: '8px' }}>
              <CheckCircle2 size={16} />
              <strong style={{ fontSize: '12px' }}>Consultation Completion</strong>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
              {kpis.completedConsultations || 104} / 128
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>81.2% monthly resolution</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-primary)', marginBottom: '8px' }}>
              <Clock size={16} />
              <strong style={{ fontSize: '12px' }}>Doctor Workload</strong>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
              {kpis.averageDoctorWorkload || '62%'}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>Optimal capacity utilization</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-indigo)', marginBottom: '8px' }}>
              <Activity size={16} />
              <strong style={{ fontSize: '12px' }}>Bed Occupancy</strong>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
              {occupancyPct}%
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>{occupiedBeds} of {totalBeds} beds occupied</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-warning)', marginBottom: '8px' }}>
              <Sparkles size={16} />
              <strong style={{ fontSize: '12px' }}>AI Screening Triaged</strong>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
              {kpis.totalAiPredictions || 91}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>31 Fracture · 29 Diabetes · 31 Heart</span>
          </div>
        </div>
      </div>

      {/* Recent Administrative Activity Section */}
      <div className="ha-card-panel">
        <div className="ha-card-panel-header">
          <div>
            <h3>Recent Administrative Activity</h3>
            <p>Recent configuration, department, and institutional governance changes</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--ha-text-muted)' }}>
            <ShieldCheck size={14} style={{ color: 'var(--ha-teal)' }} />
            <span>Audit Trail Active</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {auditLogs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--ha-border)',
                backgroundColor: 'var(--ha-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ha-soft-bg)',
                    color: 'var(--ha-primary)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileCode size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: '12px', color: 'var(--ha-text-primary)', display: 'block' }}>
                    {log.action}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>
                    Actor: {log.actor} · Unit: {log.department}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>
                  {log.timestamp}
                </span>
                <span className="ha-badge success" style={{ fontSize: '10px' }}>
                  {log.status || 'Verified'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
