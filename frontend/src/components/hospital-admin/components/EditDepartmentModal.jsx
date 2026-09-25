import { useState } from 'react';
import { X, Save, Layers, BedDouble, UserCheck } from 'lucide-react';

export function EditDepartmentModal({
  department,
  departmentHeads = [],
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    name: department.name || '',
    code: department.code || '',
    specialization: department.specialization || department.name || '',
    wardCapacity: department.wardCapacity || 40,
    headId: department.headId || '',
    headName: department.headName || 'Unassigned',
    headEmail: department.headEmail || '',
    status: department.status || 'Active',
    floor: department.floor || 'Level 1, Wing A',
    aiService: department.aiService || 'General Health Triaging',
    description: department.description || '',
  });

  const [error, setError] = useState('');

  const handleHeadChange = (headId) => {
    if (!headId) {
      setFormData({
        ...formData,
        headId: '',
        headName: 'Unassigned',
        headEmail: '',
      });
      return;
    }
    const found = departmentHeads.find((h) => h.id === headId);
    if (found) {
      setFormData({
        ...formData,
        headId: found.id,
        headName: found.name,
        headEmail: found.email,
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Department Name is required.');
      return;
    }
    if (!formData.code.trim()) {
      setError('Department Code is required.');
      return;
    }
    if (Number(formData.wardCapacity) <= 0) {
      setError('Bed Capacity must be a valid positive number.');
      return;
    }

    setError('');
    onSave(department.id, {
      ...formData,
      wardCapacity: Number(formData.wardCapacity),
      code: formData.code.trim().toUpperCase(),
      specialization: formData.specialization.trim(),
    });
  };

  return (
    <div className="ha-modal-backdrop" onClick={onClose}>
      <div className="ha-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ha-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={20} style={{ color: 'var(--ha-primary)' }} />
            <h3>Edit Department: {department.name}</h3>
          </div>
          <button className="ha-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ha-modal-body">
            {error && (
              <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: 'var(--ha-error-bg)', color: 'var(--ha-error)', fontSize: '12px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <div className="ha-form">
              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Department Name *</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="ha-form-group">
                  <label>Department Code *</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Specialization / Clinical Type</label>
                  <input
                    type="text"
                    className="ha-input"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  />
                </div>
                <div className="ha-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BedDouble size={14} style={{ color: 'var(--ha-primary)' }} /> Bed Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="ha-input"
                    value={formData.wardCapacity}
                    onChange={(e) => setFormData({ ...formData, wardCapacity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={14} style={{ color: 'var(--ha-teal)' }} /> Department Head Assignment
                  </label>
                  <select
                    className="ha-select"
                    value={formData.headId}
                    onChange={(e) => handleHeadChange(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {departmentHeads.map((head) => (
                      <option key={head.id} value={head.id}>
                        {head.name} ({head.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ha-form-group">
                  <label>Operating Status</label>
                  <select
                    className="ha-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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
                  <label>Integrated AI Screening Pipeline</label>
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
              </div>

              <div className="ha-form-group">
                <label>Department Description</label>
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
