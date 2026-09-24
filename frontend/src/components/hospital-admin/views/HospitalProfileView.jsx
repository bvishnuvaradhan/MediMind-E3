import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  ShieldCheck,
  Edit,
  Award,
  BedDouble,
  CheckCircle,
} from 'lucide-react';

export function HospitalProfileView({ hospital, onEdit }) {
  return (
    <div>
      <div className="ha-page-header">
        <div className="ha-page-header-info">
          <div className="ha-page-icon-wrapper">
            <Building2 size={24} />
          </div>
          <div>
            <h1>Hospital Profile & Facility Management</h1>
            <p>Official healthcare institution parameters, accreditation, contact details, and facility overview</p>
          </div>
        </div>
        <button className="ha-btn ha-btn-primary" onClick={onEdit}>
          <Edit size={16} /> Edit Hospital Information
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Main Details Panel */}
        <div className="ha-card-panel" style={{ margin: 0 }}>
          <div className="ha-card-panel-header">
            <h3>Institution Identity</h3>
            <span className="ha-badge success">Operating Active</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Hospital Name
              </span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ha-text-primary)' }}>
                {hospital.name}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ha-text-secondary)' }}>
                {hospital.tagline}
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <MapPin size={16} style={{ color: 'var(--ha-primary)' }} />
                <strong style={{ fontSize: '12px' }}>Physical Address</strong>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ha-text-secondary)', lineHeight: 1.4 }}>
                {hospital.address}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-text-muted)', marginBottom: '4px' }}>
                  <Phone size={14} />
                  <span style={{ fontSize: '11px' }}>General Phone</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{hospital.phone}</div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-error-bg)', border: '1px solid #fca5a5' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-error)', marginBottom: '4px' }}>
                  <Phone size={14} />
                  <span style={{ fontSize: '11px', fontWeight: 700 }}>24/7 Emergency</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ha-error)' }}>
                  {hospital.emergencyPhone}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-text-muted)', marginBottom: '4px' }}>
                  <Mail size={14} />
                  <span style={{ fontSize: '11px' }}>Contact Email</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{hospital.email}</div>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ha-text-muted)', marginBottom: '4px' }}>
                  <Globe size={14} />
                  <span style={{ fontSize: '11px' }}>Website</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{hospital.website}</div>
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Clock size={16} style={{ color: 'var(--ha-teal)' }} />
                <strong style={{ fontSize: '12px' }}>Hospital Operating Hours</strong>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ha-text-secondary)' }}>
                {hospital.operatingHours}
              </div>
            </div>
          </div>
        </div>

        {/* Capacity, Accreditation & Facilities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Capacity & Accreditation */}
          <div className="ha-card-panel" style={{ margin: 0 }}>
            <div className="ha-card-panel-header">
              <h3>Capacity & Regulatory Standing</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-primary)', marginBottom: '4px' }}>
                  <BedDouble size={18} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Bed Capacity</span>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{hospital.totalBeds} Beds</div>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>84% Current Occupancy</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-indigo)', marginBottom: '4px' }}>
                  <Award size={18} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Accreditation</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800 }}>{hospital.accreditation}</div>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>Valid through 2028</span>
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--ha-teal)' }} />
              <div>
                <strong style={{ fontSize: '12px', display: 'block' }}>State Healthcare License: {hospital.licenseNumber}</strong>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>Established {hospital.establishedYear} · Certified Level-3 Multi-Specialty Facility</span>
              </div>
            </div>
          </div>

          {/* Clinical Facilities */}
          <div className="ha-card-panel" style={{ margin: 0 }}>
            <div className="ha-card-panel-header">
              <h3>Specialized Facilities & Clinical Infrastructure</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {hospital.facilities?.map((facility) => (
                <div
                  key={facility}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--ha-bg)',
                    border: '1px solid var(--ha-border)',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  <CheckCircle size={15} style={{ color: 'var(--ha-teal)', flexShrink: 0 }} />
                  <span>{facility}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

