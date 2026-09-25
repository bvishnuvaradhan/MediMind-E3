import { useState } from 'react';
import { X, Building2, Save, BedDouble, Award, ShieldCheck } from 'lucide-react';

export function EditHospitalModal({ hospital, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: hospital.name || '',
    tagline: hospital.tagline || '',
    phone: hospital.phone || '',
    emergencyPhone: hospital.emergencyPhone || '',
    email: hospital.email || '',
    adminEmail: hospital.adminEmail || '',
    website: hospital.website || '',
    address: hospital.address || '',
    description: hospital.description || '',
    operatingHours: hospital.operatingHours || '',
    totalBeds: hospital.totalBeds || 250,
    occupiedBeds: hospital.occupiedBeds || 210,
    accreditation: hospital.accreditation || 'NABH & JCI Accredited',
    accreditationValidThrough: hospital.accreditationValidThrough || '2028',
    licenseNumber: hospital.licenseNumber || 'KA-MED-HOSP-2018-0941',
    establishedYear: hospital.establishedYear || 2018,
    facilityLevel: hospital.facilityLevel || 'Certified Level-3 Multi-Specialty Tertiary Care Facility',
    facilitiesText: Array.isArray(hospital.facilities) ? hospital.facilities.join('\n') : (hospital.facilities || ''),
  });

  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Number(formData.totalBeds) <= 0) {
      setError('Total bed capacity must be a positive number greater than 0.');
      return;
    }
    setError('');

    const parsedFacilities = formData.facilitiesText
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const submissionData = {
      ...formData,
      totalBeds: Number(formData.totalBeds),
      occupiedBeds: Number(formData.occupiedBeds),
      establishedYear: Number(formData.establishedYear) || 2018,
      facilities: parsedFacilities.length > 0 ? parsedFacilities : hospital.facilities,
    };
    delete submissionData.facilitiesText;

    onSave(submissionData);
  };

  return (
    <div className="ha-modal-backdrop" onClick={onClose}>
      <div className="ha-modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="ha-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} style={{ color: 'var(--ha-primary)' }} />
            <h3>Edit Hospital & Facility Information</h3>
          </div>
          <button className="ha-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ha-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--ha-error-bg)', color: 'var(--ha-error)', fontSize: '12px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div className="ha-form">
              {/* Institution Identity */}
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ha-text-muted)', marginBottom: '4px' }}>
                Institution Identity & Contact Details
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Hospital Name *</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="ha-form-group">
                  <label>Institutional Tagline</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  />
                </div>
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>General Phone *</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="ha-form-group">
                  <label>24/7 Emergency Hotline *</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    className="ha-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="ha-form-group">
                  <label>Administrative Email</label>
                  <input
                    type="email"
                    className="ha-input"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  />
                </div>
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Website URL</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
                <div className="ha-form-group">
                  <label>Operating Hours</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.operatingHours}
                    onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  />
                </div>
              </div>

              <div className="ha-form-group">
                <label>Physical Address *</label>
                <input
                  type="text"
                  className="ha-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              {/* Facility Capacity & Regulatory Standing */}
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ha-text-muted)', marginTop: '12px', marginBottom: '4px' }}>
                Capacity, Accreditation & Licensing
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BedDouble size={14} style={{ color: 'var(--ha-primary)' }} /> Total Bed Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="ha-input"
                    value={formData.totalBeds}
                    onChange={(e) => setFormData({ ...formData, totalBeds: e.target.value })}
                    required
                  />
                </div>
                <div className="ha-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={14} style={{ color: 'var(--ha-indigo)' }} /> Accreditation Standing
                  </label>
                  <input
                    type="text"
                    className="ha-input"
                    placeholder="e.g. NABH & JCI Accredited"
                    value={formData.accreditation}
                    onChange={(e) => setFormData({ ...formData, accreditation: e.target.value })}
                  />
                </div>
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Accreditation Valid Through</label>
                  <input
                    type="text"
                    className="ha-input"
                    placeholder="e.g. 2028 or Dec 2028"
                    value={formData.accreditationValidThrough}
                    onChange={(e) => setFormData({ ...formData, accreditationValidThrough: e.target.value })}
                  />
                </div>
                <div className="ha-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} style={{ color: 'var(--ha-teal)' }} /> State License / Reg Number
                  </label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Established Year</label>
                  <input
                    type="number"
                    min="1900"
                    max="2099"
                    className="ha-input"
                    value={formData.establishedYear}
                    onChange={(e) => setFormData({ ...formData, establishedYear: e.target.value })}
                  />
                </div>
                <div className="ha-form-group">
                  <label>Facility Level / Classification</label>
                  <input
                    type="text"
                    className="ha-input"
                    placeholder="e.g. Certified Level-3 Multi-Specialty Tertiary Care Facility"
                    value={formData.facilityLevel}
                    onChange={(e) => setFormData({ ...formData, facilityLevel: e.target.value })}
                  />
                </div>
              </div>

              <div className="ha-form-group">
                <label>Specialized Facilities & Clinical Infrastructure (one per line)</label>
                <textarea
                  rows={4}
                  className="ha-textarea"
                  placeholder="24x7 Emergency & Trauma Center&#10;Advanced Radiology & Digital X-Ray&#10;Cardiac Catheterization Lab"
                  value={formData.facilitiesText}
                  onChange={(e) => setFormData({ ...formData, facilitiesText: e.target.value })}
                />
              </div>

              <div className="ha-form-group">
                <label>Institutional Overview / Description</label>
                <textarea
                  rows={3}
                  className="ha-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="ha-modal-footer">
            <button type="button" className="ha-btn ha-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ha-btn ha-btn-primary">
              <Save size={16} />
              Save Facility Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
