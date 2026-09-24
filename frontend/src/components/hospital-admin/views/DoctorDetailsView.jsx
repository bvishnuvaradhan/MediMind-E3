import {
  ArrowLeft,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  Building2,
  Clock,
  Star,
  Activity,
  CheckCircle,
} from 'lucide-react';

export function DoctorDetailsView({ doctor, onBack, onToggleStatus }) {
  if (!doctor) return null;

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <button className="ha-btn ha-btn-secondary ha-btn-sm" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Doctors
          </button>
          <div>
            <h1>{doctor.name}</h1>
            <p>{doctor.specialization} · {doctor.department}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="ha-btn ha-btn-outline"
            onClick={() => onToggleStatus(doctor.id)}
          >
            {doctor.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Doctor Summary Card */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--ha-primary), var(--ha-teal))',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              {doctor.avatarInitials}
            </div>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '18px', fontWeight: 700 }}>
                {doctor.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span className={`ha-badge ${doctor.status.toLowerCase()}`}>
                  {doctor.status}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 700, color: '#eab308' }}>
                  <Star size={13} fill="#eab308" /> {doctor.rating}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-text-muted)', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>
                <Building2 size={13} /> CLINICAL DEPARTMENT
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{doctor.department}</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-text-muted)', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>
                <GraduationCap size={13} /> QUALIFICATIONS & SPECIALTY
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{doctor.qualification}</div>
              <span style={{ fontSize: '11px', color: 'var(--ha-primary)' }}>{doctor.specialization}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ha-text-muted)', fontSize: '11px', marginBottom: '2px' }}>
                  <Phone size={12} /> PHONE
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600 }}>{doctor.phone}</div>
              </div>

              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ha-text-muted)', fontSize: '11px', marginBottom: '2px' }}>
                  <Mail size={12} /> EMAIL
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{doctor.email}</div>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-text-muted)', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>
                <Clock size={13} /> CONSULTATION SCHEDULE
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ha-teal)' }}>{doctor.schedule}</div>
            </div>
          </div>
        </div>

        {/* Operational Metrics & Governance */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ha-card-panel" style={{ margin: 0 }}>
            <div className="ha-card-panel-header">
              <h3>Doctor Clinical Throughput & Workload</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-primary)', marginBottom: '4px' }}>
                  <Activity size={15} />
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Workload</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{doctor.workload} Active</div>
                <span style={{ fontSize: '10px', color: 'var(--ha-text-muted)' }}>Max Capacity: {doctor.maxCapacity}</span>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-teal)', marginBottom: '4px' }}>
                  <CheckCircle size={15} />
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Consultations</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{doctor.consultationsCompleted}</div>
                <span style={{ fontSize: '10px', color: 'var(--ha-text-muted)' }}>Completed this cycle</span>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-indigo)', marginBottom: '4px' }}>
                  <Calendar size={15} />
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Experience</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{doctor.experience}</div>
                <span style={{ fontSize: '10px', color: 'var(--ha-text-muted)' }}>Clinical Practice</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--ha-text-muted)' }}>Capacity Utilization</span>
                <strong>{Math.round((doctor.workload / doctor.maxCapacity) * 100)}%</strong>
              </div>
              <div className="ha-progress-bar-bg">
                <div
                  className="ha-progress-bar-fill"
                  style={{ width: `${(doctor.workload / doctor.maxCapacity) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="ha-card-panel" style={{ margin: 0 }}>
            <div className="ha-card-panel-header">
              <h3>Role Isolation & Governance Notice</h3>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)', lineHeight: 1.5 }}>
              Hospital Administrators oversee doctor active status, clinical schedules, and hospital-wide appointment volumes. In accordance with the locked MediMind permission matrix, Hospital Administrators do <strong>not</strong> have access to private patient medical charts, consultation notes, or diagnostic scans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

