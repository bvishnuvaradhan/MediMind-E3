import React, { useState } from 'react';

export function AppointmentsView({
  appointments = [],
  doctors = [],
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [doctorFilter, setDoctorFilter] = useState('All');
  const [selectedAiApt, setSelectedAiApt] = useState(null);

  const filteredAppointments = appointments.filter((apt) => {
    const status = apt.status || 'Confirmed';
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    const matchesDoctor = doctorFilter === 'All' || apt.doctorId === doctorFilter;
    const q = searchTerm.toLowerCase();
    const patientStr = (apt.patientRef || apt.patientName || '').toLowerCase();
    const tokenStr = (apt.token || apt.id || '').toLowerCase();
    const docStr = (apt.doctorName || '').toLowerCase();
    const matchesSearch = patientStr.includes(q) || tokenStr.includes(q) || docStr.includes(q);
    return matchesStatus && matchesDoctor && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Privacy Notice */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              Department OPD Appointment Schedule
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              View-only operational tracking of consultation slots and patient triage flow
            </p>
          </div>
          <div style={{ padding: '6px 12px', backgroundColor: 'var(--dh-soft-bg)', borderRadius: '6px', fontSize: '12px', color: 'var(--dh-primary-light)', fontWeight: 600 }}>
            Operational View-Only (Strict Clinical Patient Privacy Boundary)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="dh-card" style={{ padding: '16px 20px' }}>
        <div className="dh-filter-bar" style={{ margin: 0 }}>
          <div className="dh-filter-left">
            <div className="dh-search-input">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                placeholder="Search patient, token, doctor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="dh-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Appointment Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <select
              className="dh-select"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
            >
              <option value="All">All Attending Doctors</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--dh-text-muted)' }}>
            Showing <strong>{filteredAppointments.length}</strong> of {appointments.length} appointments
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="dh-card">
        <div className="dh-table-container">
          <table className="dh-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient Identifier</th>
                <th>Attending Doctor</th>
                <th>Slot Time</th>
                <th>Type</th>
                <th>AI Triage Pre-Check</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--dh-text-muted)' }}>
                    No appointments found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const statusStr = apt.status || 'Confirmed';
                  const statusClass = statusStr.toLowerCase().replace(/\s+/g, '-');
                  const tokenText = apt.token || apt.id?.toUpperCase() || 'ORTHO-OPD';
                  const patientLabel = apt.patientRef || apt.patientName || 'Operational Patient Ref';
                  const isWalkIn = Boolean(apt.isWalkIn) || apt.type === 'Walk-in' || String(tokenText).startsWith('W-');
                  const hasAi = !isWalkIn && apt.aiPreCheck && apt.aiPreCheck !== 'Not Screened';

                  return (
                    <tr key={apt.id}>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--dh-primary-light)', fontFamily: 'monospace', fontSize: '13px' }}>
                          {tokenText}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{patientLabel}</div>
                        <div style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>
                          {apt.gender && apt.age ? `${apt.gender}, ${apt.age}y` : (apt.mode || 'In-Person')}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{apt.doctorName || 'Assigned Clinician'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)' }}>{apt.room || 'OPD Room'}</div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{apt.time}</td>
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
                      <td style={{ textAlign: 'right' }}>
                        <span className={`dh-badge dh-badge-${statusClass}`}>
                          {statusStr}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
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

export default AppointmentsView;
