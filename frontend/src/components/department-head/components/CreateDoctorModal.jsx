import React, { useState } from 'react';

export function CreateDoctorModal({ isOpen, onClose, onSave, departmentName = 'Orthopedics', hospitalName = 'MediMind Central Hospital' }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'Joint Replacement & Arthroscopy',
    qualification: 'MBBS, MS (Orthopedics)',
    experience: '5 years',
    room: 'OPD Room 208',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Please provide doctor name and email address.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSave({
        ...formData,
        status: 'Active',
      });
      onClose();
    } catch {
      setError('Failed to provision doctor account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dh-modal-overlay" onClick={onClose}>
      <div className="dh-modal-box lg" onClick={(e) => e.stopPropagation()}>
        <div className="dh-modal-header">
          <div>
            <h3 className="dh-modal-title">Provision Doctor Account</h3>
            <div className="dh-card-description">
              Onboard a clinical specialist into {departmentName}
            </div>
          </div>
          <button className="dh-btn-icon" onClick={onClose} aria-label="Close modal">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dh-modal-body">
            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--dh-error-bg)', color: 'var(--dh-error)', fontSize: '13px' }}>
                {error}
              </div>
            )}

            <div className="dh-form-row">
              <div className="dh-form-group">
                <label className="dh-label">Department (Scope-Locked)</label>
                <input className="dh-input" value={departmentName} disabled />
                <span className="dh-input-hint">Department Heads can only provision staff within their department.</span>
              </div>
              <div className="dh-form-group">
                <label className="dh-label">Hospital</label>
                <input className="dh-input" value={hospitalName} disabled />
              </div>
            </div>

            <div className="dh-form-row">
              <div className="dh-form-group">
                <label className="dh-label">Doctor Full Name *</label>
                <input
                  className="dh-input"
                  name="name"
                  placeholder="e.g. Dr. Rajesh Pillai"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="dh-form-group">
                <label className="dh-label">Official Hospital Email *</label>
                <input
                  className="dh-input"
                  name="email"
                  type="email"
                  placeholder="rajesh.pillai@medimindhospital.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="dh-form-row">
              <div className="dh-form-group">
                <label className="dh-label">Contact Phone</label>
                <input
                  className="dh-input"
                  name="phone"
                  placeholder="+91 98765 21004"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="dh-form-group">
                <label className="dh-label">Specialization</label>
                <select
                  className="dh-select"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                >
                  <option value="Joint Replacement & Arthroscopy">Joint Replacement & Arthroscopy</option>
                  <option value="Pediatric Orthopedics & Trauma">Pediatric Orthopedics & Trauma</option>
                  <option value="Spine Surgery & Complex Trauma">Spine Surgery & Complex Trauma</option>
                  <option value="Sports Medicine & Ligament Reconstruction">Sports Medicine & Ligament Reconstruction</option>
                  <option value="Musculoskeletal Oncology">Musculoskeletal Oncology</option>
                  <option value="Hand & Upper Extremity Surgery">Hand & Upper Extremity Surgery</option>
                </select>
              </div>
            </div>

            <div className="dh-form-row">
              <div className="dh-form-group">
                <label className="dh-label">Qualifications</label>
                <input
                  className="dh-input"
                  name="qualification"
                  placeholder="e.g. MBBS, MS (Orthopedics), M.Ch"
                  value={formData.qualification}
                  onChange={handleChange}
                />
              </div>
              <div className="dh-form-group">
                <label className="dh-label">Clinical Experience</label>
                <input
                  className="dh-input"
                  name="experience"
                  placeholder="e.g. 8 years"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="dh-form-group">
              <label className="dh-label">Allocated OPD Room *</label>
              <input
                className="dh-input"
                name="room"
                placeholder="e.g. OPD Room 208"
                value={formData.room}
                onChange={handleChange}
                required
              />
              <span className="dh-input-hint">Assigned consultation room managed by Department Head.</span>
            </div>
          </div>

          <div className="dh-modal-footer">
            <button type="button" className="dh-btn dh-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="dh-btn dh-btn-primary" disabled={submitting}>
              {submitting ? 'Provisioning...' : 'Provision Doctor Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateDoctorModal;
