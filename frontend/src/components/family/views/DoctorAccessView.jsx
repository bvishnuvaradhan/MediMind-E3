import { useState } from 'react';
import { LockKeyhole, ShieldCheck, Trash2 } from 'lucide-react';

export function DoctorAccessView({ members, accessEntries, onGrant, onRevoke }) {
  const doctors = [
    { name: 'Dr. Rahul Mehta', department: 'Orthopedics' },
    { name: 'Dr. Ananya Rao', department: 'Cardiology' },
    { name: 'Dr. Kavya Shah', department: 'Diabetology' },
  ];
  const [selectedMember, setSelectedMember] = useState(members[0]?.name ?? '');
  const [selectedDoctor, setSelectedDoctor] = useState(doctors[0].name);
  const doctor = doctors.find((item) => item.name === selectedDoctor) ?? doctors[0];

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <LockKeyhole size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Doctor Access</h1>
          <p>Share one patient's complete authorized history with a specific doctor.</p>
        </div>
      </div>

      <div className="feature-panel doctor-access-panel">
        <div className="access-form">
          <label>
            <span>Family member</span>
            <select
              value={selectedMember}
              onChange={(event) => setSelectedMember(event.target.value)}
            >
              {members.map((item) => (
                <option key={item.name}>{item.name}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Doctor</span>
            <select
              value={selectedDoctor}
              onChange={(event) => setSelectedDoctor(event.target.value)}
            >
              {doctors.map((item) => (
                <option key={item.name}>{item.name}</option>
              ))}
            </select>
          </label>

          <div className="share-everything">
            <ShieldCheck size={17} />
            <div>
              <strong>Share Everything</strong>
              <span>Complete authorized medical history for this patient</span>
            </div>
          </div>

          <button
            className="primary-button"
            onClick={() =>
              onGrant({
                member: selectedMember,
                doctor: doctor.name,
                department: doctor.department,
              })
            }
          >
            Grant access
          </button>
        </div>

        <div className="feature-list">
          {accessEntries.length === 0 ? (
            <div className="empty-feature">
              <div className="empty-art">
                <LockKeyhole size={24} />
              </div>
              <h2>No active access</h2>
              <p>Grant a patient-specific doctor authorization to get started.</p>
            </div>
          ) : (
            accessEntries.map((entry) => (
              <article
                className="feature-card"
                key={`${entry.member}-${entry.doctor}`}
              >
                <div className="avatar avatar-lilac">DR</div>
                <div>
                  <h3>{entry.doctor}</h3>
                  <p>
                    {entry.department} · Patient: {entry.member}
                  </p>
                  <span className="feature-meta">
                    Share Everything · Granted {entry.granted}
                  </span>
                </div>
                <button
                  className="delete-member-button"
                  onClick={() => onRevoke(entry)}
                  aria-label={`Revoke ${entry.doctor} access`}
                >
                  <Trash2 size={16} />
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
