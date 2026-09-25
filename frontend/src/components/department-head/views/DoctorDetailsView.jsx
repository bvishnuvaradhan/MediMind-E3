import React from 'react';

export function DoctorDetailsView({
  doctor,
  appointments = [],
  onBack,
  onOpenEditDoctor,
  onToggleStatus,
}) {
  if (!doctor) {
    return (
      <div className="dh-card" style={{ textAlign: 'center', padding: '40px' }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--dh-text-primary)' }}>Doctor Profile Not Found</h3>
        <p style={{ color: 'var(--dh-text-muted)', fontSize: '13.5px', marginBottom: '20px' }}>
          The requested doctor account is not found in the department directory.
        </p>
        <button className="dh-btn dh-btn-primary" onClick={onBack}>
          &larr; Back to Doctors Directory
        </button>
      </div>
    );
  }

  const doctorAppointments = appointments.filter(
    (a) => a.doctorId === doctor.id || (a.doctorName && a.doctorName.includes(doctor.name.split(' ').slice(-1)[0]))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Bar with Back and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button className="dh-btn dh-btn-outline" onClick={onBack}>
          &larr; Back to Faculty Doctors
        </button>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="dh-btn dh-btn-primary" onClick={() => onOpenEditDoctor(doctor)}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Assignment & Status
          </button>
          <button
            className={`dh-btn ${doctor.status === 'Active' ? 'dh-btn-outline' : 'dh-btn-primary'}`}
            onClick={() => onToggleStatus(doctor.id, doctor.status === 'Active' ? 'Inactive' : 'Active')}
          >
            {doctor.status === 'Active' ? 'Deactivate Doctor' : 'Activate Doctor'}
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="dh-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              className="dh-avatar-circle"
              style={{
                width: '64px',
                height: '64px',
                fontSize: '22px',
                background: 'linear-gradient(135deg, #312e81, #2563eb)',
              }}
            >
              {doctor.avatarInitials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--dh-text-primary)' }}>
                  {doctor.name}
                </h2>
                <span className={`dh-badge dh-badge-${doctor.status.toLowerCase().replace(' ', '-')}`}>
                  ● {doctor.status}
                </span>
                <span className="dh-badge dh-badge-scheduled">
                  {doctor.department || 'Orthopedics'}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--dh-blue)', fontWeight: 600, marginTop: '2px' }}>
                {doctor.specialization}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--dh-text-muted)', marginTop: '2px' }}>
                {doctor.qualification} • {doctor.experience} Experience • Assigned: {doctor.room}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ padding: '12px 18px', backgroundColor: 'var(--dh-bg)', borderRadius: '10px', border: '1px solid var(--dh-border)', textAlign: 'center' }}>
              <div className="dh-info-label">Satisfaction</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dh-warning)', marginTop: '2px' }}>★ {doctor.rating}</div>
            </div>
            <div style={{ padding: '12px 18px', backgroundColor: 'var(--dh-bg)', borderRadius: '10px', border: '1px solid var(--dh-border)', textAlign: 'center' }}>
              <div className="dh-info-label">Completed</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dh-text-primary)', marginTop: '2px' }}>{doctor.consultationsCompleted}</div>
            </div>
            <div style={{ padding: '12px 18px', backgroundColor: 'var(--dh-bg)', borderRadius: '10px', border: '1px solid var(--dh-border)', textAlign: 'center' }}>
              <div className="dh-info-label">Active Load</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dh-primary-light)', marginTop: '2px' }}>{doctor.workload} Cases</div>
            </div>
          </div>
        </div>
      </div>

      {/* Structured Key-Value Grids */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1: Professional & Credential Details */}
        <div className="dh-card">
          <div className="dh-section-header">
            <h4 className="dh-section-title">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--dh-blue)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Faculty Doctor Profile & Credentials
            </h4>
          </div>

          <div className="dh-info-grid">
            <div className="dh-info-tile">
              <span className="dh-info-label">Full Doctor Name</span>
              <span className="dh-info-value">{doctor.name}</span>
            </div>
            <div className="dh-info-tile">
              <span className="dh-info-label">Official Email</span>
              <span className="dh-info-value" style={{ wordBreak: 'break-all' }}>{doctor.email}</span>
            </div>
            <div className="dh-info-tile">
              <span className="dh-info-label">Contact Phone</span>
              <span className="dh-info-value">{doctor.phone}</span>
            </div>
            <div className="dh-info-tile">
              <span className="dh-info-label">Specialization</span>
              <span className="dh-info-value highlight">{doctor.specialization}</span>
            </div>
            <div className="dh-info-tile">
              <span className="dh-info-label">Academic Qualifications</span>
              <span className="dh-info-value">{doctor.qualification}</span>
            </div>
            <div className="dh-info-tile">
              <span className="dh-info-label">Clinical Experience</span>
              <span className="dh-info-value">{doctor.experience}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Operational Assignment & Status */}
        <div className="dh-card">
          <div className="dh-section-header">
            <h4 className="dh-section-title">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--dh-teal)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Operational Assignment & Department Status
            </h4>
          </div>

          <div className="dh-info-grid">
            <div className="dh-info-tile">
              <span className="dh-info-label">Allocated OPD Room</span>
              <span className="dh-info-value highlight">{doctor.room}</span>
            </div>
            <div className="dh-info-tile">
              <span className="dh-info-label">Current Active Load</span>
              <span className="dh-info-value">{doctor.workload} active bookings</span>
            </div>
            <div className="dh-info-tile">
              <span className="dh-info-label">Department ID</span>
              <span className="dh-info-value" style={{ fontFamily: 'monospace' }}>{doctor.departmentId || 'dept_ortho'}</span>
            </div>
            <div className="dh-info-tile">
              <span className="dh-info-label">Doctor Status</span>
              <span className="dh-info-value">● {doctor.status}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Today's Assigned Operational Appointments */}
        <div className="dh-card">
          <div className="dh-section-header">
            <h4 className="dh-section-title">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--dh-blue)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Today's Assigned Appointments ({doctorAppointments.length})
            </h4>
          </div>

          {doctorAppointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--dh-text-muted)', fontSize: '13px' }}>
              No appointments scheduled for this doctor today.
            </div>
          ) : (
            <div className="dh-table-container">
              <table className="dh-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Patient Identifier</th>
                    <th>Slot Time</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {doctorAppointments.map((apt) => (
                    <tr key={apt.id}>
                      <td style={{ fontWeight: 800, color: 'var(--dh-primary-light)', fontFamily: 'monospace' }}>
                        {apt.token || apt.id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{apt.patientRef || apt.patientName || 'Unknown Patient'}</div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{apt.time || apt.slotTime || '09:00 AM'}</td>
                      <td>
                        <span className="dh-badge dh-badge-draft">{apt.type || 'In-Person OPD'}</span>
                      </td>
                      <td>
                        <span className={`dh-badge dh-badge-${(apt.status || 'scheduled').toLowerCase().replace(' ', '-')}`}>
                          {apt.status || 'Scheduled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDetailsView;
