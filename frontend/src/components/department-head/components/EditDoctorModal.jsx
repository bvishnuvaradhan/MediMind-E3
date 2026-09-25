import React, { useState } from 'react';

function EditDoctorForm({ doctor, onSave, onClose }) {
  const [formData, setFormData] = useState({
    room: doctor?.room || '',
    status: doctor?.status === 'Inactive' ? 'Inactive' : 'Active',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.room.trim()) {
      setError('Please provide an allocated OPD room.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSave(doctor.id, {
        ...doctor,
        room: formData.room,
        status: formData.status,
      });
      onClose();
    } catch {
      setError('Failed to update doctor profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dh-modal-box lg" onClick={(e) => e.stopPropagation()}>
      <div className="dh-modal-header">
        <div>
          <h3 className="dh-modal-title">Edit Faculty Doctor Operational Assignment</h3>
          <div className="dh-card-description">
            Update allocated OPD room and operational status for {doctor.name}
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

          {/* Department Head Editable Controls */}
          <div style={{ padding: '14px', backgroundColor: 'var(--dh-soft-bg)', borderRadius: '8px', border: '1px solid var(--dh-border)', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dh-primary-light)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Department Head Operational Controls
            </div>
            <div className="dh-form-row">
              <div className="dh-form-group">
                <label className="dh-label">Allocated OPD Room *</label>
                <input
                  className="dh-input"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="e.g. Room 302, OPD Block B"
                  required
                />
              </div>
              <div className="dh-form-group">
                <label className="dh-label">Doctor Status *</label>
                <select
                  className="dh-select"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Clinician & Admin Managed Read-Only Information */}
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dh-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
            Clinician & Hospital Admin Managed (Read-Only)
          </div>

          <div className="dh-form-row">
            <div className="dh-form-group">
              <label className="dh-label">Doctor Full Name</label>
              <input
                className="dh-input"
                value={doctor.name || ''}
                disabled
              />
            </div>
            <div className="dh-form-group">
              <label className="dh-label">Official Hospital Email</label>
              <input
                className="dh-input"
                value={doctor.email || ''}
                disabled
              />
            </div>
          </div>

          <div className="dh-form-row">
            <div className="dh-form-group">
              <label className="dh-label">Contact Phone</label>
              <input
                className="dh-input"
                value={doctor.phone || ''}
                disabled
              />
            </div>
            <div className="dh-form-group">
              <label className="dh-label">Specialization</label>
              <input
                className="dh-input"
                value={doctor.specialization || ''}
                disabled
              />
            </div>
          </div>

          <div className="dh-form-row">
            <div className="dh-form-group">
              <label className="dh-label">Qualifications</label>
              <input
                className="dh-input"
                value={doctor.qualification || ''}
                disabled
              />
            </div>
            <div className="dh-form-group">
              <label className="dh-label">Clinical Experience</label>
              <input
                className="dh-input"
                value={doctor.experience || ''}
                disabled
              />
            </div>
          </div>

          <div className="dh-form-row">
            <div className="dh-form-group">
              <label className="dh-label">OPD Shift Schedule (Clinician Managed)</label>
              <input
                className="dh-input"
                value={doctor.schedule || ''}
                disabled
              />
            </div>
            <div className="dh-form-group">
              <label className="dh-label">Max Consultation Capacity (Clinician Managed)</label>
              <input
                className="dh-input"
                value={doctor.maxCapacity ? `${doctor.maxCapacity} patients / day` : '25 patients / day'}
                disabled
              />
            </div>
          </div>
        </div>

        <div className="dh-modal-footer">
          <button type="button" className="dh-btn dh-btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="dh-btn dh-btn-primary" disabled={submitting}>
            {submitting ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditDoctorModal({ isOpen, onClose, onSave, doctor }) {
  if (!isOpen || !doctor) return null;

  return (
    <div className="dh-modal-overlay" onClick={onClose}>
      <EditDoctorForm key={doctor.id} doctor={doctor} onSave={onSave} onClose={onClose} />
    </div>
  );
}

export default EditDoctorModal;
