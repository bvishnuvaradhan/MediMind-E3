import { useState } from 'react';
import { X, Building2, Save } from 'lucide-react';

export function EditHospitalModal({ hospital, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: hospital.name || '',
    phone: hospital.phone || '',
    emergencyPhone: hospital.emergencyPhone || '',
    email: hospital.email || '',
    website: hospital.website || '',
    address: hospital.address || '',
    description: hospital.description || '',
    operatingHours: hospital.operatingHours || '',
    totalBeds: hospital.totalBeds || 250,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="ha-modal-backdrop" onClick={onClose}>
      <div className="ha-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ha-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} style={{ color: 'var(--ha-primary)' }} />
            <h3>Edit Hospital Information</h3>
          </div>
          <button className="ha-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ha-modal-body">
            <div className="ha-form">
              <div className="ha-form-group">
                <label>Hospital Name</label>
                <input
                  type="text"
                  className="ha-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Primary Phone</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="ha-form-group">
                  <label>Emergency Hotline (24/7)</label>
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
                  <label>Contact Email</label>
                  <input
                    type="email"
                    className="ha-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="ha-form-group">
                  <label>Website URL</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>

              <div className="ha-form-group">
                <label>Address</label>
                <input
                  type="text"
                  className="ha-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
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

              <div className="ha-form-group">
                <label>Hospital Overview / Description</label>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

