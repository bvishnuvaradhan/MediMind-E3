import { useState } from 'react';
import { X, UserPlus, UserCheck } from 'lucide-react';

export function CreateDepartmentHeadModal({ departments, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    qualification: '',
    experience: '10 years',
    departmentId: departments[0]?.id || '',
    department: departments[0]?.name || '',
  });

  const handleDeptChange = (deptId) => {
    const selected = departments.find((d) => d.id === deptId);
    setFormData({
      ...formData,
      departmentId: deptId,
      department: selected ? selected.name : '',
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="ha-modal-backdrop" onClick={onClose}>
      <div className="ha-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ha-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserPlus size={20} style={{ color: 'var(--ha-primary)' }} />
            <h3>Create Department Head Account</h3>
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
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="ha-input"
                    placeholder="e.g. Dr. Rajeshwari Rao"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="ha-form-group">
                  <label>Assign Department</label>
                  <select
                    className="ha-select"
                    value={formData.departmentId}
                    onChange={(e) => handleDeptChange(e.target.value)}
                    required
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Work Email</label>
                  <input
                    type="email"
                    className="ha-input"
                    placeholder="name@medimindhospital.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="ha-form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="ha-input"
                    placeholder="+91 98765 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="ha-form-row">
                <div className="ha-form-group">
                  <label>Account Initial Password</label>
                  <input
                    type="password"
                    className="ha-input"
                    placeholder="Minimum 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="ha-form-group">
                  <label>Clinical Experience</label>
                  <input
                    type="text"
                    className="ha-input"
                    placeholder="e.g. 15 years"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="ha-form-group">
                <label>Medical Qualifications</label>
                <input
                  type="text"
                  className="ha-input"
                  placeholder="e.g. MBBS, MS, DNB (Specialty), FACC"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          <div className="ha-modal-footer">
            <button type="button" className="ha-btn ha-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="ha-btn ha-btn-primary">
              <UserCheck size={16} />
              Create & Assign Head
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

