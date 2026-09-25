import React from 'react';
import StatCard from '../components/StatCard';

export function DashboardView({
  departmentInfo,
  doctors = [],
  appointments = [],
  analytics,
  onNavigate,
  onOpenCreateDoctor,
  onOpenCreateArticle,
}) {
  const activeDoctors = doctors.filter((d) => d.status === 'Active').length;
  const todayAppointments = appointments.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Department Header */}
      <div className="dh-card" style={{ background: 'linear-gradient(135deg, rgba(49, 46, 129, 0.08), rgba(37, 99, 235, 0.04))', border: '1px solid rgba(49, 46, 129, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="dh-badge dh-badge-scheduled">{departmentInfo?.code || 'ORTHO'}</span>
              <span style={{ fontSize: '13px', color: 'var(--dh-text-muted)' }}>{departmentInfo?.hospital || 'MediMind Central Hospital'} • {departmentInfo?.floor || 'Level 2, Wing A'}</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              {departmentInfo?.name || 'Orthopedics'} Department Hub
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-secondary)', maxWidth: '680px' }}>
              {departmentInfo?.description || 'Center of Excellence in joint reconstruction, trauma management, and AI fracture screening.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="dh-btn dh-btn-primary" onClick={onOpenCreateDoctor}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Provision Doctor
            </button>
            <button className="dh-btn dh-btn-outline" onClick={onOpenCreateArticle}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Publish Guideline
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="dh-stat-grid">
        <StatCard
          label="Active Doctors"
          value={`${activeDoctors} / ${doctors.length}`}
          tone="indigo"
          change="+1 this month"
          changeType="positive"
          subtext="Full department roster"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          label="Today's OPD Appointments"
          value={todayAppointments}
          tone="blue"
          change="100% covered"
          changeType="positive"
          subtext="Orthopedic outpatient slots"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Bed Occupancy (Ortho Ward)"
          value={departmentInfo?.bedOccupancy || '88%'}
          tone="coral"
          change="53 / 60 beds"
          changeType="neutral"
          subtext="Musculoskeletal wing"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          label="AI Scans Screened"
          value={analytics?.aiPipelineSummary?.totalScans || 31}
          tone="teal"
          change="97.4% accuracy"
          changeType="positive"
          subtext="Fracture Detection CNN"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Two Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Doctors & Workload Preview */}
        <div className="dh-card">
          <div className="dh-card-header">
            <div>
              <h3 className="dh-card-title">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--dh-blue)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Department Doctor Workload
              </h3>
              <div className="dh-card-description">Today's patient capacity utilization</div>
            </div>
            <button className="dh-btn dh-btn-ghost dh-btn-sm" onClick={() => onNavigate('workload')}>
              Manage All &rarr;
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {doctors.map((doc) => {
              return (
                <div key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="dh-avatar-circle" style={{ width: '30px', height: '30px', fontSize: '11px' }}>
                        {doc.avatarInitials}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dh-text-primary)' }}>
                          {doc.name}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>
                          {doc.specialization} • {doc.room}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--dh-primary-light)' }}>
                        {doc.workload} active cases
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)' }}>{doc.status}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Aggregate & Diagnostic Pipeline */}
        <div className="dh-card">
          <div className="dh-card-header">
            <div>
              <h3 className="dh-card-title">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--dh-teal)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                AI Diagnostic Telemetry
              </h3>
              <div className="dh-card-description">Fracture Detection CNN (Aggregate Scans)</div>
            </div>
            <button className="dh-btn dh-btn-ghost dh-btn-sm" onClick={() => onNavigate('ai_analytics')}>
              Telemetry &rarr;
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--dh-soft-teal)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--dh-teal)', fontWeight: 600, textTransform: 'uppercase' }}>Fractures Flagged</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dh-text-primary)' }}>
                {analytics?.aiPipelineSummary?.fracturesDetected || 19}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)' }}>61.3% positive rate</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--dh-soft-bg)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--dh-primary-light)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Inference Latency</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dh-text-primary)' }}>
                {analytics?.aiPipelineSummary?.avgProcessingTime || '1.4s'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)' }}>Real-time triage</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dh-text-secondary)' }}>
              Top Anatomical Fracture Regions Screened:
            </div>
            {(analytics?.aiPipelineSummary?.commonFractureTypes || [
              { type: 'Distal Radius / Wrist', count: 8, confidence: '98.2%' },
              { type: 'Femoral Neck / Hip', count: 5, confidence: '96.5%' },
              { type: 'Tibia / Ankle Malleolus', count: 4, confidence: '97.1%' },
            ]).map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', padding: '6px 8px', backgroundColor: 'var(--dh-bg)', borderRadius: '6px' }}>
                <span style={{ fontWeight: 500, color: 'var(--dh-text-primary)' }}>{f.type}</span>
                <span style={{ fontSize: '11.5px', color: 'var(--dh-teal)', fontWeight: 600 }}>{f.count} cases ({f.confidence})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Operational Appointments Summary */}
      <div className="dh-card">
        <div className="dh-card-header">
          <div>
            <h3 className="dh-card-title">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--dh-blue)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Today's Orthopedic OPD Schedule
            </h3>
            <div className="dh-card-description">
              Operational appointment slots (Department-level coordination)
            </div>
          </div>
          <button className="dh-btn dh-btn-outline dh-btn-sm" onClick={() => onNavigate('appointments')}>
            View Full Schedule &rarr;
          </button>
        </div>

        <div className="dh-table-container">
          <table className="dh-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient</th>
                <th>Assigned Doctor</th>
                <th>Time Slot</th>
                <th>Type</th>
                <th>AI Pre-Check</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.slice(0, 5).map((apt) => {
                const statusStr = apt.status || 'Confirmed';
                const statusClass = statusStr.toLowerCase().replace(/\s+/g, '-');
                const tokenText = apt.token || apt.id?.toUpperCase() || 'ORTHO-OPD';
                const patientLabel = apt.patientRef || apt.patientName || 'Operational Patient Ref';

                return (
                  <tr key={apt.id}>
                    <td style={{ fontWeight: 700, color: 'var(--dh-primary-light)', fontFamily: 'monospace' }}>
                      {tokenText}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{patientLabel}</div>
                      <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)' }}>
                        {apt.gender && apt.age ? `${apt.gender}, ${apt.age}y` : (apt.mode || 'In-Person')}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{apt.doctorName || 'Assigned Clinician'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)' }}>{apt.room || 'OPD Room'}</div>
                    </td>
                    <td>{apt.time}</td>
                    <td>
                      <span className="dh-badge dh-badge-draft">{apt.type}</span>
                    </td>
                    <td>
                      <span className="dh-badge dh-badge-completed" style={{ fontSize: '11px' }}>
                        {apt.aiScreening || (apt.aiTriaged ? 'AI Triage Complete' : 'Manual Triage')}
                      </span>
                    </td>
                    <td>
                      <span className={`dh-badge dh-badge-${statusClass}`}>
                        {statusStr}
                      </span>
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

export default DashboardView;
