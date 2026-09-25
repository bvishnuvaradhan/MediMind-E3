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
  ShieldCheck,
  User,
} from 'lucide-react';

export function DoctorDetailsView({ doctor, onBack, onToggleStatus }) {
  if (!doctor) return null;

  const workloadPct = Math.round((doctor.workload / (doctor.maxCapacity || 25)) * 100);

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
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

          <div className="ha-info-grid">
            <div className="ha-info-tile">
              <span className="ha-info-label">
                <Building2 size={13} /> Clinical Department
              </span>
              <span className="ha-info-value">{doctor.department}</span>
            </div>

            <div className="ha-info-tile">
              <span className="ha-info-label">
                <GraduationCap size={13} /> Specialization
              </span>
              <span className="ha-info-value">{doctor.specialization}</span>
            </div>

            <div className="ha-info-tile">
              <span className="ha-info-label">
                <User size={13} /> Qualifications
              </span>
              <span className="ha-info-value">{doctor.qualification}</span>
            </div>

            <div className="ha-info-tile">
              <span className="ha-info-label">
                <Clock size={13} /> Consultation Schedule
              </span>
              <span className="ha-info-value">{doctor.schedule}</span>
            </div>

            <div className="ha-info-tile">
              <span className="ha-info-label">
                <Phone size={13} /> Official Phone
              </span>
              <span className="ha-info-value">{doctor.phone}</span>
            </div>

            <div className="ha-info-tile">
              <span className="ha-info-label">
                <Mail size={13} /> Work Email
              </span>
              <span className="ha-info-value" style={{ fontSize: '12px' }}>{doctor.email}</span>
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
                <strong>{workloadPct}%</strong>
              </div>
              <div className="ha-progress-bar-bg">
                <div
                  className="ha-progress-bar-fill"
                  style={{ width: `${workloadPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="ha-card-panel" style={{ margin: 0 }}>
            <div className="ha-card-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: 'var(--ha-teal)' }} />
                <h3>Role Isolation & Governance Notice</h3>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)', lineHeight: 1.5 }}>
              Hospital Administrators oversee doctor active status, clinical privileges, and hospital-wide operational volumes. In accordance with the locked MediMind permission matrix, Hospital Administrators do <strong>not</strong> have access to private patient medical charts, consultation notes, or diagnostic scans.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

