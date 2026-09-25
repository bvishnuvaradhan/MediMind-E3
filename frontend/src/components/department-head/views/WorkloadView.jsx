import React from 'react';

export function WorkloadView({
  doctors = [],
}) {
  const totalWorkload = doctors.reduce((sum, d) => sum + (Number(d.workload) || 0), 0);
  const activeDoctorsCount = doctors.filter((d) => d.status === 'Active').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              Department Workload & Active Caseload Overview
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              Monitor outpatient consultation caseload and operational room assignments across faculty specialists
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ padding: '8px 14px', backgroundColor: 'var(--dh-soft-bg)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)', textTransform: 'uppercase' }}>Active Faculty</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dh-primary-light)' }}>{activeDoctorsCount} / {doctors.length} Doctors</div>
            </div>
            <div style={{ padding: '8px 14px', backgroundColor: 'var(--dh-soft-teal)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--dh-teal)', textTransform: 'uppercase' }}>Total Active Load</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dh-teal)' }}>{totalWorkload} Active Bookings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {doctors.map((doc) => {
          const load = Number(doc.workload) || 0;

          return (
            <div key={doc.id} className="dh-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="dh-avatar-circle" style={{ width: '42px', height: '42px', fontSize: '14px' }}>
                    {doc.avatarInitials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--dh-text-primary)' }}>
                      {doc.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--dh-text-muted)' }}>
                      {doc.specialization}
                    </div>
                  </div>
                </div>
                <span className={`dh-badge dh-badge-${doc.status.toLowerCase().replace(' ', '-')}`}>
                  {doc.status}
                </span>
              </div>

              {/* Workload Display */}
              <div style={{ padding: '14px', backgroundColor: 'var(--dh-bg)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--dh-text-secondary)', fontWeight: 600 }}>
                    Active Consultations Caseload
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--dh-primary-light)' }}>
                    {load} Active
                  </span>
                </div>
              </div>

              {/* Allocation Information */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--dh-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--dh-text-muted)' }}>
                  Allocated Room: <strong style={{ color: 'var(--dh-text-primary)' }}>{doc.room}</strong>
                </span>
                <span style={{ fontSize: '12px', color: 'var(--dh-text-muted)' }}>
                  Completed Cases: <strong>{doc.consultationsCompleted}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WorkloadView;
