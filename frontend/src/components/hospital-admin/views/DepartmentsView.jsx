import {
  Layers,
  Plus,
  Stethoscope,
  Clock,
  Sparkles,
  BedDouble,
  ToggleLeft,
  ToggleRight,
  MapPin,
} from 'lucide-react';

export function DepartmentsView({
  departments,
  onOpenCreateDept,
  onToggleStatus,
  navigate,
}) {
  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <Layers size={24} />
          </div>
          <div>
            <h1>Departments Management</h1>
            <p>Configure hospital clinical departments, Department Head assignments, and AI diagnostic service bindings</p>
          </div>
        </div>
        <button className="ha-btn ha-btn-primary" onClick={onOpenCreateDept}>
          <Plus size={16} /> Create Department
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {departments.map((dept) => (
          <div key={dept.id} className="ha-card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--ha-soft-bg)',
                    color: 'var(--ha-primary)',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Stethoscope size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '16px', fontWeight: 700 }}>
                    {dept.name}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--ha-primary)', fontWeight: 700 }}>
                    CODE: {dept.code}
                  </span>
                </div>
              </div>

              <span className={`ha-badge ${dept.status.toLowerCase()}`}>
                {dept.status}
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)', lineHeight: 1.45 }}>
              {dept.description}
            </p>

            {/* Department Meta */}
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--ha-text-muted)' }}>Department Head:</span>
                <strong style={{ color: 'var(--ha-text-primary)' }}>{dept.headName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--ha-text-muted)' }}>Clinical Doctors:</span>
                <strong style={{ color: 'var(--ha-text-primary)' }}>{dept.doctorsCount} Staff Doctors</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--ha-text-muted)' }}>Active Appointments:</span>
                <strong style={{ color: 'var(--ha-primary)' }}>{dept.activeAppointments} Bookings</strong>
              </div>
            </div>

            {/* AI Service & Bed Capacity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-teal)', marginBottom: '3px' }}>
                  <Sparkles size={14} />
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>AI Pipeline</span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ha-text-primary)' }}>
                  {dept.aiService.split('(')[0]}
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-indigo)', marginBottom: '3px' }}>
                  <BedDouble size={14} />
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>Bed Capacity</span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ha-text-primary)' }}>
                  {dept.wardCapacity} Beds ({dept.bedOccupancy})
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ha-text-muted)', paddingTop: '8px', borderTop: '1px solid var(--ha-border)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> {dept.operatingHours}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> {dept.floor}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '8px' }}>
              <button
                className="ha-btn ha-btn-secondary ha-btn-sm"
                style={{ flex: 1 }}
                onClick={() => navigate('Doctors')}
              >
                View Doctors
              </button>
              <button
                className="ha-btn ha-btn-outline ha-btn-sm"
                onClick={() => onToggleStatus(dept.id)}
                title={dept.status === 'Active' ? 'Deactivate department' : 'Activate department'}
              >
                {dept.status === 'Active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {dept.status === 'Active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

