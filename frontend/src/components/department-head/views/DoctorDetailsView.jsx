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
        <p>Doctor not found.</p>
        <button className="dh-btn dh-btn-primary" onClick={onBack}>
          Back to Doctors List
        </button>
      </div>
    );
  }

  const doctorAppointments = appointments.filter((a) => a.doctorName.includes(doctor.name.split(' ').slice(-1)[0]) || a.doctorId === doctor.id);
  const utilPct = Math.round((doctor.workload / doctor.maxCapacity) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back button & top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="dh-btn dh-btn-outline" onClick={onBack}>
          &larr; Back to Doctors
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="dh-btn dh-btn-outline" onClick={() => onOpenEditDoctor(doctor)}>
            Edit Profile
          </button>
          <button
            className={`dh-btn ${doctor.status === 'Active' ? 'dh-btn-outline' : 'dh-btn-primary'}`}
            onClick={() => onToggleStatus(doctor.id, doctor.status === 'Active' ? 'On Leave' : 'Active')}
          >
            {doctor.status === 'Active' ? 'Mark as On Leave' : 'Mark as Active'}
          </button>
        </div>
      </div>

      {/* Main Profile Header */}
      <div className="dh-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div className="dh-avatar-circle" style={{ width: '64px', height: '64px', fontSize: '22px' }}>
              {doctor.avatarInitials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--dh-text-primary)' }}>
                  {doctor.name}
                </h2>
                <span className={`dh-badge dh-badge-${doctor.status.toLowerCase().replace(' ', '-')}`}>
                  {doctor.status}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--dh-blue)', fontWeight: 600, marginTop: '2px' }}>
                {doctor.specialization}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--dh-text-muted)', marginTop: '4px' }}>
                {doctor.qualification} • {doctor.experience} Experience
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ padding: '12px 18px', backgroundColor: 'var(--dh-bg)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Satisfaction</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dh-warning)', marginTop: '2px' }}>★ {doctor.rating}</div>
            </div>
            <div style={{ padding: '12px 18px', backgroundColor: 'var(--dh-bg)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Completed</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dh-text-primary)', marginTop: '2px' }}>{doctor.consultationsCompleted}</div>
            </div>
            <div style={{ padding: '12px 18px', backgroundColor: 'var(--dh-bg)', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Capacity Load</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--dh-primary-light)', marginTop: '2px' }}>{utilPct}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Operational Details & Today's Schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Contact & Facility Assignment */}
        <div className="dh-card">
          <h3 className="dh-card-title" style={{ marginBottom: '16px' }}>
            Operational & Facility Assignment
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13.5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--dh-border)' }}>
              <span style={{ color: 'var(--dh-text-muted)' }}>Official Email</span>
              <span style={{ fontWeight: 600, color: 'var(--dh-text-primary)' }}>{doctor.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--dh-border)' }}>
              <span style={{ color: 'var(--dh-text-muted)' }}>Direct Phone</span>
              <span style={{ fontWeight: 600, color: 'var(--dh-text-primary)' }}>{doctor.phone}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--dh-border)' }}>
              <span style={{ color: 'var(--dh-text-muted)' }}>Assigned OPD Room</span>
              <span style={{ fontWeight: 600, color: 'var(--dh-primary-light)' }}>{doctor.room}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--dh-border)' }}>
              <span style={{ color: 'var(--dh-text-muted)' }}>OPD Shift Timings</span>
              <span style={{ fontWeight: 600, color: 'var(--dh-text-primary)' }}>{doctor.schedule}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--dh-text-muted)' }}>Daily Max Capacity</span>
              <span style={{ fontWeight: 600, color: 'var(--dh-text-primary)' }}>{doctor.maxCapacity} patients / day</span>
            </div>
          </div>
        </div>

        {/* Assigned Operational Appointments */}
        <div className="dh-card">
          <h3 className="dh-card-title" style={{ marginBottom: '16px' }}>
            Today's Assigned Appointments ({doctorAppointments.length})
          </h3>
          {doctorAppointments.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--dh-text-muted)', margin: 0 }}>
              No appointments currently scheduled for this doctor today.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {doctorAppointments.map((apt) => (
                <div
                  key={apt.id}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'var(--dh-bg)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>
                      <span style={{ color: 'var(--dh-primary-light)', marginRight: '6px' }}>{apt.token}</span>
                      {apt.patientName}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)' }}>
                      {apt.time} • {apt.type}
                    </div>
                  </div>
                  <span className={`dh-badge dh-badge-${apt.status.toLowerCase().replace(' ', '-')}`}>
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorDetailsView;
