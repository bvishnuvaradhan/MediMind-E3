import React, { useState } from 'react';

export function AppointmentsView({
  appointments = [],
  onSelectPatient,
  onOpenNewConsultation,
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
              Manage today's booked OPD patient consultation slots and triage
            </p>
          </div>
          <button className="doctor-btn doctor-btn-primary" onClick={() => onOpenNewConsultation()}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Walk-in Consultation
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
                <th style={{ textAlign: 'right' }}>Actions</th>
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
                filteredAppointments.map((apt) => (
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
                      <span className="doctor-badge doctor-badge-completed" style={{ fontSize: '11px' }}>
                        {apt.aiPreCheck || 'Screened'}
                      </span>
                    </td>
                    <td>
                      <span className={`doctor-badge doctor-badge-${apt.status.toLowerCase().replace(' ', '-')}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="doctor-btn doctor-btn-primary doctor-btn-sm"
                          onClick={() => onSelectPatient(apt.patientId)}
                        >
                          Records
                        </button>
                        {apt.status !== 'Completed' && (
                          <button
                            className="doctor-btn doctor-btn-outline doctor-btn-sm"
                            onClick={() => onUpdateStatus(apt.id, 'Completed')}
                          >
                            Mark Done
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AppointmentsView;
