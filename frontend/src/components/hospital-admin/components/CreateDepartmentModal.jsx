import { useState } from 'react';
import { X, Plus, Layers } from 'lucide-react';

export function CreateDepartmentModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    operatingHours: '09:00 – 18:00',
    floor: 'Level 1, Wing A',
    wardCapacity: 40,
    aiService: 'General Health Triaging',
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
            <Layers size={20} style={{ color: 'var(--ha-primary)' }} />
            <h3>Create Hospital Department</h3>
          </div>
          <button className="ha-modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ha-modal-body">
            <div className="ha-form">
              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Department Name</label>
                  <input
                    type="text"
                    className="ha-input"
                    placeholder="e.g. Neurology & Spine"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="ha-form-group">
                  <label>Department Code</label>
                  <input
                    type="text"
                    className="ha-input"
                    placeholder="e.g. NEURO"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Floor / Wing Location</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
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
                <label>Integrated AI Screening Service</label>
                <select
                  className="ha-select"
                  value={formData.aiService}
                  onChange={(e) => setFormData({ ...formData, aiService: e.target.value })}
                >
                  <option value="Fracture Detection (CNN)">Fracture Detection (CNN)</option>
                  <option value="Diabetes Risk Scoring (Gradient Boosting)">Diabetes Risk Scoring (Gradient Boosting)</option>
                  <option value="Heart Disease Risk Scoring (Deep Ensemble)">Heart Disease Risk Scoring (Deep Ensemble)</option>
                  <option value="General Health Triaging">General Health Triaging</option>
                </select>
              </div>

              <div className="ha-form-group">
                <label>Department Description</label>
                <textarea
                  rows={3}
                  className="ha-textarea"
                  placeholder="Describe the clinical focus and scope of this department..."
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
              <Plus size={16} />
              Create Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

