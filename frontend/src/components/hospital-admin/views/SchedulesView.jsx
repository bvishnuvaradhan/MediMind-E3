import {
  Clock,
  Building2,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export function SchedulesView({ schedules }) {
  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <Clock size={24} />
          </div>
          <div>
            <h1>Hospital Operating Schedules & Shift Allocation</h1>
            <p>Coordinate department consultation hours, doctor active shifts, emergency trauma on-call rosters, and room utilization</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--ha-success)', backgroundColor: 'var(--ha-success-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <CheckCircle size={16} />
          <span>0 Scheduling Conflicts Detected Across Hospital</span>
        </div>
      </div>

      {/* Department Schedules Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {schedules.map((sch) => (
          <div key={sch.departmentId} className="ha-card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={20} style={{ color: 'var(--ha-primary)' }} />
                <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '16px', fontWeight: 700 }}>
                  {sch.department}
                </h3>
              </div>
              <span className="ha-badge info">
                <Clock size={12} /> {sch.operatingHours}
              </span>
            </div>

            {/* Department Head On Duty */}
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-indigo)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                <UserCheck size={14} /> Department Head On-Duty
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ha-text-primary)' }}>
                {sch.onDutyHead}
              </div>
            </div>

            {/* Shift Roster */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ha-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                Active Doctor Shift Roster
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sch.doctorsOnDuty.map((docShift) => (
                  <div
                    key={docShift}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--ha-bg)',
                      border: '1px solid var(--ha-border)',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Stethoscope size={14} style={{ color: 'var(--ha-primary)' }} />
                    <span>{docShift}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Coverage */}
            <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-error)', fontSize: '11px', fontWeight: 700, marginBottom: '2px' }}>
                <ShieldCheck size={13} /> 24/7 Emergency & On-Call Coverage
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b' }}>
                {sch.emergencyCoverage}
              </div>
            </div>

            {/* Room Allocations */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ha-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Allocated Clinical Rooms & Suites
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {sch.roomAllocations.map((room) => (
                  <span
                    key={room}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--ha-bg)',
                      border: '1px solid var(--ha-border)',
                      fontSize: '11px',
                      color: 'var(--ha-text-secondary)',
                      fontWeight: 500,
                    }}
                  >
                    {room}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

