import {
  UserCheck,
  UserPlus,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  ToggleLeft,
  ToggleRight,
  ChevronRight,
} from 'lucide-react';

export function DepartmentHeadsView({
  departmentHeads,
  onOpenCreateHead,
  onToggleStatus,
  onSelectHead,
}) {
  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <UserCheck size={24} />
          </div>
          <div>
            <h1>Department Heads Management</h1>
            <p>Appoint, supervise, and manage clinical Department Heads across Orthopedics, Diabetology, and Cardiology</p>
          </div>
        </div>
        <button className="ha-btn ha-btn-primary" onClick={onOpenCreateHead}>
          <UserPlus size={16} /> Create Department Head
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {departmentHeads.map((head) => (
          <div key={head.id} className="ha-card-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, var(--ha-primary), var(--ha-indigo))',
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '15px',
                    fontWeight: 700,
                  }}
                >
                  {head.avatarInitials}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Montserrat', fontSize: '16px', fontWeight: 700 }}>
                    {head.name}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--ha-primary)', fontWeight: 600 }}>
                    {head.department}
                  </span>
                </div>
              </div>

              <span className={`ha-badge ${head.status.toLowerCase()}`}>
                {head.status}
              </span>
            </div>

            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ha-text-secondary)' }}>
                <GraduationCap size={15} style={{ color: 'var(--ha-primary)', flexShrink: 0 }} />
                <span>{head.qualification}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ha-text-secondary)' }}>
                <Calendar size={15} style={{ color: 'var(--ha-teal)', flexShrink: 0 }} />
                <span>Experience: {head.experience} · Assigned {head.assignedDate}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ha-text-muted)', marginBottom: '2px' }}>
                  <Phone size={13} />
                  <span style={{ fontSize: '11px' }}>Contact Phone</span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600 }}>{head.phone}</div>
              </div>

              <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--ha-text-muted)', marginBottom: '2px' }}>
                  <Mail size={13} />
                  <span style={{ fontSize: '11px' }}>Work Email</span>
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {head.email}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ha-text-muted)', paddingTop: '4px' }}>
              <span>Supervised Staff Doctors: <strong style={{ color: 'var(--ha-text-primary)' }}>{head.doctorsUnderSupervision}</strong></span>
              <span>Published Articles: <strong style={{ color: 'var(--ha-text-primary)' }}>{head.publishedArticles}</strong></span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '8px' }}>
              <button
                className="ha-btn ha-btn-secondary ha-btn-sm"
                style={{ flex: 1 }}
                onClick={() => onSelectHead(head)}
              >
                Head Details <ChevronRight size={14} />
              </button>
              <button
                className="ha-btn ha-btn-outline ha-btn-sm"
                onClick={() => onToggleStatus(head.id)}
              >
                {head.status === 'Active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {head.status === 'Active' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

