import {
  ArrowLeft,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  Building2,
  BookOpen,
  Users,
} from 'lucide-react';

export function DepartmentHeadDetailsView({ head, onBack, onToggleStatus }) {
  if (!head) return null;

  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <button className="ha-btn ha-btn-secondary ha-btn-sm" onClick={onBack}>
            <ArrowLeft size={16} /> Back to Heads
          </button>
          <div>
            <h1>{head.name}</h1>
            <p>Department Head · {head.department}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="ha-btn ha-btn-outline"
            onClick={() => onToggleStatus(head.id)}
          >
            {head.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Profile Card */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--ha-primary), var(--ha-indigo))',
                color: '#ffffff',
                display: 'grid',
                placeItems: 'center',
                fontSize: '20px',
                fontWeight: 700,
              }}
            >
              {head.avatarInitials}
            </div>
            <div>
              <h2 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '18px', fontWeight: 700 }}>
                {head.name}
              </h2>
              <span className={`ha-badge ${head.status.toLowerCase()}`} style={{ marginTop: '6px' }}>
                {head.status}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: 'var(--ha-text-muted)', fontSize: '11px', fontWeight: 600 }}>
                <Building2 size={14} /> ASSIGNED CLINICAL DEPARTMENT
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>{head.department}</div>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', color: 'var(--ha-text-muted)', fontSize: '11px', fontWeight: 600 }}>
                <GraduationCap size={14} /> MEDICAL QUALIFICATIONS
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{head.qualification}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-text-muted)', fontSize: '11px', marginBottom: '4px' }}>
                  <Phone size={13} /> PHONE
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{head.phone}</div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-text-muted)', fontSize: '11px', marginBottom: '4px' }}>
                  <Mail size={13} /> EMAIL
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{head.email}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Administrative & Clinical Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="ha-card-panel" style={{ margin: 0 }}>
            <div className="ha-card-panel-header">
              <h3>Departmental Leadership & Metrics</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-primary)', marginBottom: '4px' }}>
                  <Users size={16} />
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Staff Doctors</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{head.doctorsUnderSupervision} Supervised</div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-teal)', marginBottom: '4px' }}>
                  <Calendar size={16} />
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Total Experience</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{head.experience}</div>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-indigo)', marginBottom: '4px' }}>
                  <BookOpen size={16} />
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>Published Articles</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{head.publishedArticles} Articles</div>
              </div>
            </div>
          </div>

          <div className="ha-card-panel" style={{ margin: 0 }}>
            <div className="ha-card-panel-header">
              <h3>Administrative Authority Scope</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--ha-text-secondary)', lineHeight: 1.6 }}>
              <li>Authorized to create and provision Doctor accounts within {head.department}.</li>
              <li>Coordinates department-level consultation schedules, weekly shifts, and emergency trauma coverage.</li>
              <li>Reviews and approves clinical knowledge and doctor research articles prior to hospital publication.</li>
              <li>Monitors doctor performance, consultation throughput, and aggregate diagnostic AI utilization.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

