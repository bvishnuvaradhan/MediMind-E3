import { useState } from 'react';
import { X, LockKeyhole, ShieldCheck } from 'lucide-react';

export function GrantAccessModal({
  isOpen,
  onClose,
  familyMembers = [],
  activeMember,
  onGrantAccess,
}) {
  const doctorsList = [
    { name: 'Dr. Rahul Mehta', department: 'Orthopedics', hospital: 'MediMind Central Hospital' },
    { name: 'Dr. Ananya Rao', department: 'Cardiology', hospital: 'Heart & Wellness Center' },
    { name: 'Dr. Kavya Shah', department: 'Diabetology', hospital: 'City Care Clinic' },
    { name: 'Dr. Kumar Iyer', department: 'General Medicine', hospital: 'Apex Health Center' },
  ];

  const [selectedMember, setSelectedMember] = useState(activeMember?.name || familyMembers[0]?.name || 'Father');
  const [selectedDoctorName, setSelectedDoctorName] = useState(doctorsList[0].name);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const doc = doctorsList.find((d) => d.name === selectedDoctorName) || doctorsList[0];
    onGrantAccess({
      member: selectedMember,
      doctor: doc.name,
      department: doc.department,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal grant-access-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="grant-access-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="modal-icon" style={{ margin: 0 }}>
              <LockKeyhole size={20} />
            </div>
            <div>
              <p className="eyebrow">Doctor Access</p>
              <h2 id="grant-access-title" style={{ margin: 0, fontSize: '18px' }}>
                Authorize Doctor Access
              </h2>
            </div>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close grant access modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          <div className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Family Member *</span>
              <select
                className="feature-input"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
              >
                {familyMembers.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.relation})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Select Doctor *</span>
              <select
                className="feature-input"
                value={selectedDoctorName}
                onChange={(e) => setSelectedDoctorName(e.target.value)}
              >
                {doctorsList.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} · {d.department} ({d.hospital})
                  </option>
                ))}
              </select>
            </label>

            <div className="share-everything" style={{ marginTop: '4px' }}>
              <ShieldCheck size={18} />
              <div>
                <strong>Share Full Medical History</strong>
                <span>Allows the selected clinician to view lab reports, imaging, and AI risk telemetry during consultations</span>
              </div>
            </div>
          </div>

          <div className="modal-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              <LockKeyhole size={16} /> Grant Authorization
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
