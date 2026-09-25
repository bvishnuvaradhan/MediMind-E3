import { useState } from 'react';
import { X, User, Save } from 'lucide-react';

export function EditMemberModal({ isOpen, onClose, member, onUpdateMember, announce }) {
  const [formData, setFormData] = useState({
    name: member?.name || '',
    relation: member?.relation || 'Family member',
    gender: member?.gender || 'Male',
    age: member?.age || '',
    dob: member?.dob || '',
    bloodGroup: member?.bloodGroup || 'O+',
    phone: member?.phone || '',
    email: member?.email || '',
    address: member?.address || 'Bengaluru, Karnataka',
    emergencyContact: member?.emergencyContact || '',
    conditions: member?.conditions || '',
    allergies: member?.allergies || '',
    treatments: member?.treatments || '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      announce('Please enter a full name.');
      return;
    }

    const updatedMember = {
      ...member,
      ...formData,
      name,
      age: formData.age ? parseInt(formData.age, 10) : member?.age || 'N/A',
      conditions: formData.conditions.trim() || 'No known conditions',
      allergies: formData.allergies.trim() || 'No known allergies',
      treatments: formData.treatments.trim() || 'No previous treatments recorded',
    };

    onUpdateMember(updatedMember);
    announce(`Profile for ${name} updated successfully.`);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal edit-member-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-member-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="modal-icon" style={{ margin: 0, backgroundColor: 'var(--family-primary-subtle)', color: 'var(--family-primary)' }}>
              <User size={20} />
            </div>
            <div>
              <p className="eyebrow">Family Account</p>
              <h2 id="edit-member-title" style={{ margin: 0, fontSize: '18px' }}>
                Edit Member Profile
              </h2>
            </div>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close edit modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Full Name *</span>
              <input
                className="feature-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Relationship</span>
              <select
                className="feature-input"
                value={formData.relation}
                onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
              >
                <option>You</option>
                <option>Family member</option>
                <option>Spouse</option>
                <option>Child</option>
                <option>Parent</option>
                <option>Sibling</option>
                <option>Other</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Date of Birth</span>
              <input
                type="text"
                className="feature-input"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                placeholder="e.g. 12 Mar 1972"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Age</span>
              <input
                type="number"
                min="0"
                max="120"
                className="feature-input"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Gender</span>
              <select
                className="feature-input"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Blood Group</span>
              <select
                className="feature-input"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              >
                <option>O+</option>
                <option>O-</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>AB+</option>
                <option>AB-</option>
                <option>Unknown</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Phone Number</span>
              <input
                type="tel"
                className="feature-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Email Address</span>
              <input
                type="email"
                className="feature-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Residential Address</span>
              <input
                className="feature-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Emergency Contact Reference</span>
              <input
                className="feature-input"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Medical Conditions</span>
              <input
                className="feature-input"
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                placeholder="e.g. Mild hypertension, Asthma"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Known Allergies</span>
              <input
                className="feature-input"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g. Penicillin, Dust, Peanuts"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Previous Treatments / Care Plan</span>
              <input
                className="feature-input"
                value={formData.treatments}
                onChange={(e) => setFormData({ ...formData, treatments: e.target.value })}
                placeholder="e.g. Regular glucose monitoring, annual cardiology check"
              />
            </label>
          </div>

          <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
