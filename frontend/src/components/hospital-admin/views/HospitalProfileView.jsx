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

export function HospitalProfileView({ hospital, profile, onEdit }) {
  const hosp = hospital || profile || {};
  const totalBeds = Number(hosp.totalBeds || hosp.bedCapacity || 250);
  const occupiedBeds = Number(hosp.occupiedBeds || 210);
  const occupancyPct = Math.round((occupiedBeds / totalBeds) * 100);

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
                {hosp.name || 'Hospital Administration'}
              </div>
              {hosp.tagline && (
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--ha-text-secondary)' }}>
                  {hosp.tagline}
                </p>
              )}
            </div>

            <div className="ha-info-grid">
              <div className="ha-info-tile" style={{ gridColumn: 'span 2' }}>
                <span className="ha-info-label">
                  <MapPin size={13} /> Physical Address
                </span>
                <span className="ha-info-value">{hosp.address}</span>
              </div>

              <div className="ha-info-tile">
                <span className="ha-info-label">
                  <Phone size={13} /> General Phone
                </span>
                <span className="ha-info-value">{hosp.phone}</span>
              </div>

              <div className="ha-info-tile" style={{ backgroundColor: 'var(--ha-error-bg)', borderColor: '#fca5a5' }}>
                <span className="ha-info-label" style={{ color: 'var(--ha-error)' }}>
                  <Phone size={13} /> 24/7 Emergency
                </span>
                <span className="ha-info-value" style={{ color: 'var(--ha-error)', fontWeight: 700 }}>
                  {hosp.emergencyPhone}
                </span>
              </div>

              <div className="ha-info-tile">
                <span className="ha-info-label">
                  <Mail size={13} /> Contact Email
                </span>
                <span className="ha-info-value" style={{ fontSize: '12px' }}>{hosp.email}</span>
              </div>

              {hosp.adminEmail && (
                <div className="ha-info-tile">
                  <span className="ha-info-label">
                    <Mail size={13} /> Admin Email
                  </span>
                  <span className="ha-info-value" style={{ fontSize: '12px' }}>{hosp.adminEmail}</span>
                </div>
              )}

              <div className="ha-info-tile">
                <span className="ha-info-label">
                  <Globe size={13} /> Website
                </span>
                <span className="ha-info-value" style={{ fontSize: '12px' }}>{hosp.website}</span>
              </div>

              <div className="ha-info-tile" style={{ gridColumn: 'span 2' }}>
                <span className="ha-info-label">
                  <Clock size={13} /> Operating Hours
                </span>
                <span className="ha-info-value">{hosp.operatingHours}</span>
              </div>
            </div>

            {hosp.description && (
              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--ha-border)' }}>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  Institutional Overview
                </span>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--ha-text-secondary)', lineHeight: 1.5 }}>
                  {hosp.description}
                </p>
              </div>
            )}
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
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{totalBeds} Beds</div>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>
                  {occupancyPct}% Current Occupancy ({occupiedBeds} occupied)
                </span>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'var(--ha-soft-bg)', border: '1px solid var(--ha-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ha-indigo)', marginBottom: '4px' }}>
                  <Award size={18} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Accreditation</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800 }}>{hosp.accreditation || 'NABH & JCI Accredited'}</div>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>
                  Valid through {hosp.accreditationValidThrough || '2028'}
                </span>
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'var(--ha-bg)', border: '1px solid var(--ha-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={20} style={{ color: 'var(--ha-teal)', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '12px', display: 'block' }}>
                  State Healthcare License: {hosp.licenseNumber || 'KA-MED-HOSP-2018-0941'}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--ha-text-muted)' }}>
                  Established {hosp.establishedYear || 2018} · {hosp.facilityLevel || 'Certified Level-3 Multi-Specialty Facility'}
                </span>
              </div>
            </div>
          </div>

          {/* Clinical Facilities */}
          <div className="ha-card-panel" style={{ margin: 0 }}>
            <div className="ha-card-panel-header">
              <h3>Specialized Facilities & Clinical Infrastructure</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {(hosp.facilities || []).map((facility) => (
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
