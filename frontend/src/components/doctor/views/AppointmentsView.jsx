import React, { useState } from 'react';

function resolvePatientForAppointment(apt, patients = []) {
  if (!apt) return null;
  return (
    patients.find(
      (p) =>
        (apt.patientId && p.id === apt.patientId) ||
        (apt.memberId && p.memberId === apt.memberId) ||
        (apt.patientName && p.name.trim().toLowerCase() === apt.patientName.trim().toLowerCase())
    ) || null
  );
}

function resolvePredictionForAppointment(apt, patient) {
  if (!patient || !patient.aiPredictions || patient.aiPredictions.length === 0) return null;
  if (apt.aiPredictionId) {
    const matched = patient.aiPredictions.find((pred) => pred.id === apt.aiPredictionId);
    if (matched) return matched;
  }
  if (apt.aiModuleId || apt.moduleId) {
    const modId = apt.aiModuleId || apt.moduleId;
    const matched = patient.aiPredictions.find((pred) => pred.moduleId === modId);
    if (matched) return matched;
  }
  return patient.aiPredictions[0];
}

export function AppointmentsView({
  appointments = [],
  patients = [],
  onSelectPatient,
  onOpenAddWalkIn,
  onOpenNewConsultation,
  onOpenAiExplain,
  onOpenFullAiAnalysis,
  onUpdateStatus,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState('Today');

  const filteredAppointments = appointments.filter((apt) => {
    let matchesTab = true;
    if (tabFilter === 'Today') matchesTab = apt.date?.includes('Today');
    else if (tabFilter === 'Upcoming') matchesTab = apt.status === 'Confirmed' && !apt.date?.includes('Today');
    else if (tabFilter === 'Completed') matchesTab = apt.status === 'Completed';

    const q = searchTerm.toLowerCase();
    const matchesSearch =
      apt.patientName.toLowerCase().includes(q) ||
      apt.token.toLowerCase().includes(q) ||
      apt.purpose.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="doctor-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--doctor-text-primary)' }}>
              Outpatient Consultation Schedule & Appointments
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--doctor-text-muted)' }}>
              Manage today's booked OPD patient consultation slots, AI screening, and deep analysis
            </p>
          </div>
          <button
            className="doctor-btn doctor-btn-primary"
            onClick={() => (onOpenAddWalkIn ? onOpenAddWalkIn() : onOpenNewConsultation())}
          >
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            + Add Walk-in
          </button>
        </div>
      </div>

      {/* Filter and Tabs */}
      <div className="doctor-card" style={{ padding: '16px 20px' }}>
        <div className="doctor-tabs" style={{ marginBottom: '14px' }}>
          <button
            className={`doctor-tab-btn ${tabFilter === 'Today' ? 'active' : ''}`}
            onClick={() => setTabFilter('Today')}
          >
            Today's Schedule
          </button>
          <button
            className={`doctor-tab-btn ${tabFilter === 'Upcoming' ? 'active' : ''}`}
            onClick={() => setTabFilter('Upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`doctor-tab-btn ${tabFilter === 'Completed' ? 'active' : ''}`}
            onClick={() => setTabFilter('Completed')}
          >
            Completed
          </button>
          <button
            className={`doctor-tab-btn ${tabFilter === 'All' ? 'active' : ''}`}
            onClick={() => setTabFilter('All')}
          >
            All Appointments ({appointments.length})
          </button>
        </div>

        <div className="doctor-search-input">
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            placeholder="Search patient name, token, reason for visit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="doctor-card">
        <div className="doctor-table-container">
          <table className="doctor-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient Details</th>
                <th>Time & Date</th>
                <th>Consultation Type & Purpose</th>
                <th>AI Pre-Screen</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', minWidth: '320px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--doctor-text-muted)' }}>
                    No appointments found matching the current criteria.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const patient = resolvePatientForAppointment(apt, patients);
                  const prediction = resolvePredictionForAppointment(apt, patient);
                  const isWalkIn =
                    apt.type?.toLowerCase().includes('walk-in') ||
                    apt.type === 'Walk-in' ||
                    apt.purpose?.toLowerCase().includes('walk-in');

                  return (
                    <tr key={apt.id}>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--doctor-primary)', fontFamily: 'monospace' }}>
                          {apt.token}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{apt.patientName}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)' }}>
                          {apt.patientGender}, {apt.patientAge} yrs
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{apt.time}</div>
                        <div style={{ fontSize: '11px', color: 'var(--doctor-text-muted)' }}>{apt.date}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{apt.type}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--doctor-text-muted)' }}>{apt.purpose}</div>
                      </td>
                      <td>
                        {isWalkIn ? (
                          <span
                            className="doctor-badge"
                            style={{
                              fontSize: '11px',
                              backgroundColor: 'var(--doctor-bg)',
                              color: 'var(--doctor-text-muted)',
                              border: '1px solid var(--doctor-border)',
                              fontWeight: 600,
                            }}
                          >
                            Walk-in (AI Not Required)
                          </span>
                        ) : prediction && onOpenAiExplain ? (
                          <button
                            type="button"
                            className={`doctor-badge ${prediction.riskLevel === 'High' ? 'doctor-badge-high' : 'doctor-badge-completed'}`}
                            style={{
                              fontSize: '11.5px',
                              cursor: 'pointer',
                              border: 'none',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                            onClick={() => onOpenAiExplain(prediction, apt.patientName)}
                            title="Click to view concise AI Pre-Screen summary"
                          >
                            🔍 {apt.aiPreCheck || `${prediction.finding} (${prediction.confidence}%)`}
                          </button>
                        ) : apt.aiPreCheck ? (
                          <span className="doctor-badge doctor-badge-completed" style={{ fontSize: '11px' }}>
                            {apt.aiPreCheck}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--doctor-text-muted)' }}>
                            AI Pre-Screen Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`doctor-badge doctor-badge-${apt.status.toLowerCase().replace(' ', '-')}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* AI Actions: AI Pre-Screen + View Full AI Analysis */}
                          {isWalkIn ? (
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                color: 'var(--doctor-text-muted)',
                                backgroundColor: 'var(--doctor-bg, #f8fafc)',
                                borderRadius: '4px',
                                border: '1px solid var(--doctor-border, #e2e8f0)',
                                fontWeight: 600,
                              }}
                              title="Walk-in encounters do not require prior AI screening"
                            >
                              AI Not Required
                            </span>
                          ) : prediction && onOpenFullAiAnalysis ? (
                            <button
                              type="button"
                              className="doctor-btn doctor-btn-sm doctor-btn-outline"
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                color: 'var(--doctor-teal)',
                                borderColor: 'var(--doctor-teal)',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              onClick={() => onOpenFullAiAnalysis(prediction, patient?.id || apt.patientId, 'appointments')}
                              title="Open dedicated full AI analysis and Grad-CAM telemetry view"
                            >
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              View AI Analysis
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="doctor-btn doctor-btn-sm doctor-btn-outline"
                              disabled
                              style={{
                                fontSize: '11px',
                                padding: '4px 8px',
                                opacity: 0.5,
                                cursor: 'not-allowed',
                              }}
                              title="AI analysis is not available for this record."
                            >
                              No AI Analysis
                            </button>
                          )}

                          <button
                            type="button"
                            className="doctor-btn doctor-btn-primary doctor-btn-sm"
                            onClick={() => onSelectPatient(patient?.id || apt.patientId)}
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                          >
                            Records
                          </button>

                          {apt.status !== 'Completed' && (
                            <button
                              type="button"
                              className="doctor-btn doctor-btn-outline doctor-btn-sm"
                              onClick={() => onUpdateStatus(apt.id, 'Completed')}
                              style={{ fontSize: '11px', padding: '4px 8px' }}
                            >
                              Mark Done
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AppointmentsView;
