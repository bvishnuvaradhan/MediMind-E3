import React, { useState } from 'react';
import StatCard from '../components/StatCard';

export function DashboardView({
  departmentInfo,
  doctors = [],
  appointments = [],
  articles = [],
  analytics,
  onNavigate,
  onOpenCreateDoctor,
}) {
  const [selectedAiApt, setSelectedAiApt] = useState(null);
  const activeDoctors = doctors.filter((d) => d.status === 'Active').length;
  const todayAppointments = appointments.length;
  const pendingReviews = articles.filter((a) => a.status === 'Under Review');

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
            <button
              className="dh-btn dh-btn-outline"
              onClick={() => onNavigate('knowledge')}
              style={pendingReviews.length > 0 ? { borderColor: 'var(--dh-blue)', color: 'var(--dh-blue)', fontWeight: 700 } : {}}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Knowledge Review {pendingReviews.length > 0 && `(${pendingReviews.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Review Queue Alert if pending */}
      {pendingReviews.length > 0 && (
        <div
          className="dh-card"
          style={{
            padding: '12px 20px',
            backgroundColor: 'var(--dh-soft-bg)',
            borderLeft: '4px solid var(--dh-blue)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⏳</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dh-primary-light)' }}>
                {pendingReviews.length} Faculty Manuscript Pending Department Head Peer-Review
              </div>
              <div style={{ fontSize: '12px', color: 'var(--dh-text-secondary)' }}>
                Latest: "{pendingReviews[0].title}" by <strong>{pendingReviews[0].author}</strong>
              </div>
            </div>
          </div>
          <button
            className="dh-btn dh-btn-primary dh-btn-sm"
            onClick={() => onNavigate('knowledge')}
          >
            Review & Decision &rarr;
          </button>
        </div>
      )}

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
          subtext={`${departmentInfo?.name || 'Department'} outpatient slots`}
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label={`Bed Occupancy (${departmentInfo?.name || 'Ward'})`}
          value={departmentInfo?.bedOccupancy || '88%'}
          tone="coral"
          change={`${departmentInfo?.occupiedBeds || 0} / ${departmentInfo?.bedCapacity || 0} beds`}
          changeType="neutral"
          subtext={`${departmentInfo?.specialization || 'Clinical'} wing`}
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          label="AI Scans Screened"
          value={analytics?.aiPipelineSummary?.totalScans || Math.round(todayAppointments * 0.7)}
          tone="teal"
          change="98.4% accuracy"
          changeType="positive"
          subtext={departmentInfo?.linkedAi || 'AI Pipeline'}
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
            {doctors.slice(0, 3).map((doc) => {
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
              <div className="dh-card-description">{departmentInfo?.linkedAi || 'AI Pipeline'} (Aggregate Scans)</div>
            </div>
            <button className="dh-btn dh-btn-ghost dh-btn-sm" onClick={() => onNavigate('ai_analytics')}>
              Telemetry &rarr;
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', backgroundColor: 'var(--dh-soft-teal)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--dh-teal)', fontWeight: 600, textTransform: 'uppercase' }}>Anomalies Flagged</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dh-text-primary)' }}>
                {analytics?.aiPipelineSummary?.fracturesDetected || Math.round(todayAppointments * 0.4)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)' }}>High positive rate</div>
            </div>
            <div style={{ padding: '12px', backgroundColor: 'var(--dh-soft-bg)', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--dh-primary-light)', fontWeight: 600, textTransform: 'uppercase' }}>Avg Inference Latency</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dh-text-primary)' }}>
                {analytics?.aiPipelineSummary?.avgProcessingTime || '34ms'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)' }}>Real-time triage</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dh-text-secondary)' }}>
              Top Clinical Findings Flagged:
            </div>
            {(analytics?.aiPipelineSummary?.commonFractureTypes || [
              { type: 'Critical Pattern A', count: 8, confidence: '98.2%' },
              { type: 'High Risk Indicator B', count: 5, confidence: '96.5%' },
              { type: 'Routine Anomaly C', count: 4, confidence: '97.1%' },
            ]).slice(0, 3).map((f, i) => (
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
              Today's {departmentInfo?.name || 'Department'} OPD Schedule
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
              {appointments.slice(0, 3).map((apt) => {
                const statusStr = apt.status || 'Confirmed';
                const statusClass = statusStr.toLowerCase().replace(/\s+/g, '-');
                const tokenText = apt.token || apt.id?.toUpperCase() || 'ORTHO-OPD';
                const patientLabel = apt.patientRef || apt.patientName || 'Operational Patient Ref';
                const isWalkIn = Boolean(apt.isWalkIn) || apt.type === 'Walk-in' || String(tokenText).startsWith('W-');
                const hasAi = !isWalkIn && apt.aiPreCheck && apt.aiPreCheck !== 'Not Screened';

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
                      {isWalkIn ? (
                        <span className="dh-badge dh-badge-draft" style={{ fontSize: '11px' }}>
                          Manual Triage
                        </span>
                      ) : hasAi ? (
                        <button
                          type="button"
                          className="dh-badge dh-badge-completed"
                          style={{
                            fontSize: '11px',
                            cursor: 'pointer',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          onClick={() => setSelectedAiApt(apt)}
                          title="Click to view Operational AI Pre-Screen status"
                        >
                          <span>✓</span> {apt.aiPreCheck}
                        </button>
                      ) : (
                        <span className="dh-badge dh-badge-draft" style={{ fontSize: '11px' }}>
                          Manual Triage
                        </span>
                      )}
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

      {/* Operational AI Pre-Screen Status Modal */}
      {selectedAiApt && (
        <div className="dh-modal-overlay" onClick={() => setSelectedAiApt(null)}>
          <div className="dh-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="dh-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span className="dh-badge dh-badge-completed">✓ AI Triage Validated</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--dh-primary-light)' }}>
                    {selectedAiApt.token}
                  </span>
                </div>
                <h3 className="dh-modal-title">Operational AI Pre-Screen Status</h3>
              </div>
              <button className="dh-btn-icon" onClick={() => setSelectedAiApt(null)} aria-label="Close modal">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="dh-modal-body" style={{ gap: '14px' }}>
              <div style={{ padding: '14px', backgroundColor: 'var(--dh-soft-teal)', borderRadius: '8px', border: '1px solid rgba(15, 118, 110, 0.2)' }}>
                <div style={{ fontSize: '11px', color: 'var(--dh-teal)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Automated Triage Output
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--dh-text-primary)', marginTop: '2px' }}>
                  {selectedAiApt.aiPreCheck}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--dh-text-muted)', marginTop: '4px' }}>
                  Pipeline: <strong>Fracture Detection AI (ResNet-50 CNN)</strong>
                </div>
              </div>

              <div className="dh-info-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="dh-info-tile">
                  <span className="dh-info-label">Attending Doctor</span>
                  <span className="dh-info-value" style={{ fontSize: '12.5px' }}>{selectedAiApt.doctorName}</span>
                </div>
                <div className="dh-info-tile">
                  <span className="dh-info-label">Allocated Room</span>
                  <span className="dh-info-value" style={{ fontSize: '12.5px' }}>{selectedAiApt.room}</span>
                </div>
                <div className="dh-info-tile">
                  <span className="dh-info-label">Appointment Time</span>
                  <span className="dh-info-value" style={{ fontSize: '12.5px' }}>{selectedAiApt.time}</span>
                </div>
                <div className="dh-info-tile">
                  <span className="dh-info-label">Encounter Type</span>
                  <span className="dh-info-value" style={{ fontSize: '12.5px' }}>{selectedAiApt.type}</span>
                </div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: 'var(--dh-soft-bg)', borderRadius: '6px', fontSize: '11.5px', color: 'var(--dh-text-secondary)', lineHeight: 1.4 }}>
                <strong>Department Head Operational Policy:</strong> Automated pre-screening confirms imaging was triaged prior to slot opening. Detailed clinical predictions, probability heatmaps, and confidential medical history remain isolated to the attending physician's clinical encounter.
              </div>
            </div>

            <div className="dh-modal-footer">
              <button type="button" className="dh-btn dh-btn-primary" onClick={() => setSelectedAiApt(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardView;
