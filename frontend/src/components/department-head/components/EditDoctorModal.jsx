import React, { useState } from 'react';

function EditDoctorForm({ doctor, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: doctor?.name || '',
    email: doctor?.email || '',
    phone: doctor?.phone || '',
    specialization: doctor?.specialization || '',
    qualification: doctor?.qualification || '',
    experience: doctor?.experience || '',
    room: doctor?.room || '',
    schedule: doctor?.schedule || '',
    status: doctor?.status || 'Active',
    maxCapacity: doctor?.maxCapacity || 25,
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide doctor name.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSave(doctor.id, formData);
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
          <h3 className="dh-modal-title">Edit Doctor Profile</h3>
          <div className="dh-card-description">
            Update operational and clinical information for {doctor.name}
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
              <label className="dh-label">Doctor Full Name *</label>
              <input
                className="dh-input"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="dh-form-group">
              <label className="dh-label">Official Hospital Email</label>
              <input
                className="dh-input"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled
              />
            </div>
          </div>

          <div className="dh-form-row">
            <div className="dh-form-group">
              <label className="dh-label">Status</label>
              <select
                className="dh-select"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Active (Available)</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="dh-form-group">
              <label className="dh-label">Contact Phone</label>
              <input
                className="dh-input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="dh-form-row">
            <div className="dh-form-group">
              <label className="dh-label">Specialization</label>
              <input
                className="dh-input"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
              />
            </div>
            <div className="dh-form-group">
              <label className="dh-label">Qualifications</label>
              <input
                className="dh-input"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="dh-form-row">
            <div className="dh-form-group">
              <label className="dh-label">Allocated OPD Room</label>
              <input
                className="dh-input"
                name="room"
                value={formData.room}
                onChange={handleChange}
              />
            </div>
            <div className="dh-form-group">
              <label className="dh-label">OPD Shift Schedule</label>
              <input
                className="dh-input"
                name="schedule"
                value={formData.schedule}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="dh-form-row">
            <div className="dh-form-group">
              <label className="dh-label">Max Daily Consultation Capacity</label>
              <input
                type="number"
                className="dh-input"
                name="maxCapacity"
                value={formData.maxCapacity}
                onChange={handleChange}
                min="5"
                max="50"
              />
            </div>
            <div className="dh-form-group">
              <label className="dh-label">Clinical Experience</label>
              <input
                className="dh-input"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
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
