import React from 'react';

export function WorkloadView({
  doctors = [],
}) {
  const totalCapacity = doctors.reduce((sum, d) => sum + (Number(d.maxCapacity) || 0), 0);
  const totalWorkload = doctors.reduce((sum, d) => sum + (Number(d.workload) || 0), 0);
  const overallUtilization = totalCapacity > 0 ? Math.round((totalWorkload / totalCapacity) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="dh-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: 'var(--dh-text-primary)' }}>
              Department Workload & Clinical Capacity Overview
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--dh-text-muted)' }}>
              Monitor outpatient consultation caseload, utilization rates, and buffer capacity across faculty specialists
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ padding: '8px 14px', backgroundColor: 'var(--dh-soft-bg)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--dh-text-muted)', textTransform: 'uppercase' }}>Overall Dept Load</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dh-primary-light)' }}>{overallUtilization}%</div>
            </div>
            <div style={{ padding: '8px 14px', backgroundColor: 'var(--dh-soft-teal)', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--dh-teal)', textTransform: 'uppercase' }}>Available Buffer</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--dh-teal)' }}>{Math.max(0, totalCapacity - totalWorkload)} Slots</div>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {doctors.map((doc) => {
          const cap = Number(doc.maxCapacity) || 25;
          const load = Number(doc.workload) || 0;
          const utilPct = Math.round((load / cap) * 100);
          const isHigh = utilPct >= 80;
          const colorClass = utilPct > 85 ? 'red' : utilPct > 65 ? 'amber' : 'green';

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

              {/* Progress and numbers */}
              <div style={{ padding: '12px 14px', backgroundColor: 'var(--dh-bg)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--dh-text-secondary)', fontWeight: 600 }}>
                    Active Consultations / Max Quota
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--dh-text-primary)' }}>
                    {load} / {cap} ({utilPct}%)
                  </span>
                </div>
                <div className="dh-progress-container" style={{ height: '10px' }}>
                  <div className={`dh-progress-fill ${colorClass}`} style={{ width: `${Math.min(utilPct, 100)}%` }} />
                </div>
                {isHigh && (
                  <div style={{ marginTop: '8px', fontSize: '11.5px', color: 'var(--dh-coral)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>⚠</span> Approaching maximum daily clinical capacity
                  </div>
                )}
              </div>

              {/* Allocation Information */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--dh-border)' }}>
                <span style={{ fontSize: '12px', color: 'var(--dh-text-muted)' }}>
                  Assigned Room: <strong>{doc.room}</strong>
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--dh-text-muted)', fontStyle: 'italic' }}>
                  Capacity set by Clinician ({cap}/day)
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
