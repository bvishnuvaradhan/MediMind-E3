import { useState } from 'react';
import { LockKeyhole, ShieldCheck, Trash2, Plus, CheckCircle2 } from 'lucide-react';
import { matchesFamilyMember } from '../../../data/medimindData';
import { RevokeAccessModal } from '../components/RevokeAccessModal';
import { GrantAccessModal } from '../components/GrantAccessModal';

export function DoctorAccessView({
  members: propMembers,
  familyMembers = [],
  activeMember,
  doctorAccess = [],
  onGrant,
  onRevoke,
  announce = () => {},
}) {
  const members = familyMembers.length > 0 ? familyMembers : (propMembers || [{ name: 'Father' }]);
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [accessToRevoke, setAccessToRevoke] = useState(null);
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('All');

  const selectedMemberObj = members.find(
    (m) => m.name === selectedMemberFilter || m.fullName === selectedMemberFilter || m.id === selectedMemberFilter
  );

  const filteredAccess = doctorAccess.filter((entry) => {
    if (selectedMemberFilter === 'All') return true;
    return matchesFamilyMember(entry, selectedMemberObj);
  });

  const handleConfirmRevoke = (entry) => {
    if (onRevoke) {
      onRevoke(entry);
    }
  };

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <LockKeyhole size={20} />
        </span>
        <div>
          <p className="eyebrow">Privacy & Clinical Authorizations</p>
          <h1>Doctor Access</h1>
          <p>Control which healthcare clinicians have authorized access to family medical records.</p>
        </div>

        <button
          className="primary-button compact-button"
          onClick={() => setIsGrantOpen(true)}
        >
          <Plus size={16} /> Grant Doctor Access
        </button>
      </div>

      <div className="feature-panel">
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--family-soft)', borderRadius: '10px', border: '1px solid var(--family-border)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={18} style={{ color: 'var(--family-primary)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--family-ink)', lineHeight: '1.4' }}>
            <strong>HIPAA-Compliant Access Control:</strong> Booking an appointment or granting explicit authorization allows the specialist to review authorized lab reports, prescriptions, and AI telemetry. You can revoke access at any time.
          </span>
        </div>

        {/* Member Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid var(--family-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
              Member:
            </span>
            <select
              className="feature-input"
              value={selectedMemberFilter}
              onChange={(e) => {
                setSelectedMemberFilter(e.target.value);
                announce(e.target.value === 'All' ? 'Viewing doctor access for all family members.' : `Filtered doctor access for ${e.target.value}.`);
              }}
              style={{ padding: '6px 12px', fontSize: '13px', minWidth: '200px', fontWeight: '600' }}
            >
              <option value="All">All Family Members ({doctorAccess.length})</option>
              {members.map((m) => {
                const mName = m.fullName || m.name;
                const mRel = m.relationship || m.relation || 'Member';
                const count = doctorAccess.filter((entry) => matchesFamilyMember(entry, m)).length;
                return (
                  <option key={m.id || m.name} value={m.name}>
                    {mName} — {mRel} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--family-muted)' }}>
            Showing <strong>{filteredAccess.length}</strong> active authorizations
          </div>
        </div>

        <div className="feature-list">
          {filteredAccess.length === 0 ? (
            <div className="empty-feature" style={{ padding: '36px 16px', textAlign: 'center' }}>
              <div className="empty-art" style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--family-soft)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                <LockKeyhole size={24} style={{ color: 'var(--family-primary)' }} />
              </div>
              <h2 style={{ fontSize: '16px', margin: '0 0 6px 0' }}>No Active Doctor Access</h2>
              <p style={{ fontSize: '13px', color: 'var(--family-muted)', maxWidth: '340px', margin: '0 auto 14px' }}>
                Grant doctor authorization manually or book an appointment to give your specialist access to patient records.
              </p>
              <button className="primary-button" onClick={() => setIsGrantOpen(true)}>
                <Plus size={16} /> Grant Authorization
              </button>
            </div>
          ) : (
            filteredAccess.map((entry, idx) => (
              <article
                className="feature-card"
                key={`${entry.member}-${entry.doctor}-${idx}`}
              >
                <div className="avatar avatar-lilac">DR</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '14.5px' }}>{entry.doctor}</h3>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        fontWeight: '600',
                      }}
                    >
                      Active Access
                    </span>
                  </div>

                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--family-muted)' }}>
                    Specialty: <strong>{entry.department || 'Specialist'}</strong> · Patient: <strong>{entry.member}</strong>
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--family-subtle)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} style={{ color: 'var(--family-primary)' }} /> Full Records & AI Telemetry
                    </span>
                    <span>· Granted on {entry.granted || 'Recent'}</span>
                  </div>
                </div>

                <div className="feature-actions" style={{ marginLeft: 'auto' }}>
                  <button
                    className="delete-member-button"
                    onClick={() => setAccessToRevoke(entry)}
                    aria-label={`Revoke ${entry.doctor} access for ${entry.member}`}
                    title="Revoke access"
                    style={{
                      color: '#dc2626',
                      border: '1px solid var(--family-border)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} /> Revoke
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Grant Access Modal */}
      <GrantAccessModal
        isOpen={isGrantOpen}
        onClose={() => setIsGrantOpen(false)}
        familyMembers={members}
        activeMember={activeMember}
        onGrantAccess={onGrant}
        announce={announce}
      />

      {/* Revoke Confirmation Modal */}
      <RevokeAccessModal
        isOpen={!!accessToRevoke}
        onClose={() => setAccessToRevoke(null)}
        entry={accessToRevoke}
        onConfirmRevoke={handleConfirmRevoke}
      />
    </section>
  );
}
