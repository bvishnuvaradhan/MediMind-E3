import { useState } from 'react';
import { X, UsersRound } from 'lucide-react';

export function AddMemberModal({ isOpen, onClose, onAddMember, announce }) {
  const [formData, setFormData] = useState({
    name: '',
    relation: 'Family member',
    customRelation: '',
    gender: 'Male',
    age: '',
    dob: '',
    bloodGroup: 'O+',
    phone: '',
    email: '',
    conditions: '',
    allergies: '',
    emergencyContact: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      announce('Please enter a full name.');
      return;
    }

    const relation = formData.relation === 'Other' ? formData.customRelation.trim() : formData.relation;
    if (!relation) {
      announce('Please specify a relationship.');
      return;
    }

    const initials = name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'FM';

    const tones = ['coral', 'lilac', 'mint'];
    const randomTone = tones[Math.floor(Math.random() * tones.length)];

    const newMember = {
      name,
      relation,
      initials,
      tone: randomTone,
      records: 0,
      predictions: 0,
      appointments: 0,
      consultations: 0,
      prescriptions: 0,
      dob: formData.dob || 'Not provided',
      age: formData.age ? parseInt(formData.age, 10) : 'Not provided',
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      phone: formData.phone || 'Not provided',
      email: formData.email || 'Not provided',
      address: 'Bengaluru, Karnataka',
      emergencyContact: formData.emergencyContact || 'Primary Account Holder',
      conditions: formData.conditions.trim() || 'No known conditions',
      allergies: formData.allergies.trim() || 'No known allergies',
      treatments: 'No previous treatments recorded',
    };

    onAddMember(newMember);
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal add-member-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-member-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="modal-icon" style={{ margin: 0 }}>
              <UsersRound size={20} />
            </div>
            <div>
              <p className="eyebrow">Family Account</p>
              <h2 id="add-member-title" style={{ margin: 0, fontSize: '18px' }}>
                Add Family Member
              </h2>
            </div>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close add member modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Full Name *</span>
              <input
                className="feature-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Priya Kapoor"
                required
                autoFocus
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Relationship *</span>
              <select
                className="feature-input"
                value={formData.relation}
                onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
              >
                <option>Family member</option>
                <option>Spouse</option>
                <option>Child</option>
                <option>Parent</option>
                <option>Sibling</option>
                <option>Other</option>
              </select>
            </label>

            {formData.relation === 'Other' ? (
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Specify Relation *</span>
                <input
                  className="feature-input"
                  value={formData.customRelation}
                  onChange={(e) => setFormData({ ...formData, customRelation: e.target.value })}
                  placeholder="e.g. Grandfather"
                  required
                />
              </label>
            ) : (
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
            )}

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Age</span>
              <input
                type="number"
                className="feature-input"
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g. 32"
              />
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
                placeholder="+91 98765 00000"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Email Address</span>
              <input
                type="email"
                className="feature-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Known Medical Conditions</span>
              <input
                className="feature-input"
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                placeholder="e.g. None, Asthma, Diabetes"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Known Allergies</span>
              <input
                className="feature-input"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="e.g. None, Penicillin, Peanuts"
              />
            </label>
          </div>

          <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Add Member
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
