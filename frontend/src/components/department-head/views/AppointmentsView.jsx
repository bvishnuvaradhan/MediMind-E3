import React, { useState } from 'react';

export function AppointmentsView({
  appointments = [],
  doctors = [],
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [doctorFilter, setDoctorFilter] = useState('All');

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
            Operational View-Only (Zero Private Clinical History Access)
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
                        <span className="dh-badge dh-badge-completed" style={{ fontSize: '11px' }}>
                          {apt.aiScreening || (apt.aiTriaged ? 'AI Triage Complete' : 'Manual Triage')}
                        </span>
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
    </div>
  );
}

export default AppointmentsView;
