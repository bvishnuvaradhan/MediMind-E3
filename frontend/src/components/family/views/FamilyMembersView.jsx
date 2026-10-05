import { useState } from 'react';
import { UsersRound, Plus, ArrowUpRight, Trash2 } from 'lucide-react';
import { matchesFamilyMember } from '../../../data/medimindData';
import { AddMemberModal } from '../components/AddMemberModal';

export function FamilyMembersView({
  familyMembers = [],
  records = [],
  predictionHistory = [],
  navigate,
  announce,
  handleAddMember,
  handleDeleteMember,
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const confirmDelete = (member) => {
    if (familyMembers.length <= 1) {
      announce('At least one family member profile must remain in the account.');
      return;
    }
    setMemberToDelete(member);
  };

  const handleExecuteDelete = () => {
    if (memberToDelete) {
      handleDeleteMember(memberToDelete);
      setMemberToDelete(null);
    }
  };

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <UsersRound size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Family members</h1>
          <p>Manage patient profiles and authorized records in your family workspace.</p>
        </div>

        <button className="primary-button compact-button" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={16} /> Add member
        </button>
      </div>

      <div className="feature-panel">
        <div className="feature-list">
          {familyMembers.map((item, index) => {
            const displayName = item.fullName || item.name;
            const relationship = item.relationship || item.relation || 'Family member';
            const memberRecsCount = records.filter((r) => matchesFamilyMember(r, item)).length;
            const memberPredsCount = predictionHistory.filter((p) => matchesFamilyMember(p, item)).length;

            return (
              <article className="feature-card" key={`${item.id || item.name}-${index}`}>
                <div className={`avatar avatar-${item.tone || 'coral'}`}>{item.initials}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: '0 0 2px 0' }}>{displayName}</h3>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--family-muted)' }}>
                    <strong>{displayName} — {relationship}</strong> · {memberRecsCount} record{memberRecsCount !== 1 ? 's' : ''} · {memberPredsCount} prediction{memberPredsCount !== 1 ? 's' : ''} · Age {item.age || 'N/A'}
                  </p>
                </div>

                {/* Action buttons aligned right */}
                <div className="feature-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="text-button"
                    onClick={() => {
                      navigate('Member profile', { member: item });
                      announce(`Opening ${displayName}'s profile.`);
                    }}
                  >
                    View profile <ArrowUpRight size={14} />
                  </button>
                  {familyMembers.length > 1 && (
                    <button
                      type="button"
                      className="delete-member-button"
                      onClick={() => confirmDelete(item)}
                      aria-label={`Delete ${displayName}`}
                      title={`Delete ${displayName}`}
                      style={{
                        color: '#dc2626',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid transparent',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* Add Member Modal */}
        <AddMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddMember={(member) => {
            handleAddMember(member);
          }}
          announce={announce}
        />

        {/* Delete Confirmation Modal */}
        {memberToDelete && (
          <div className="modal-backdrop" role="presentation" onClick={() => setMemberToDelete(null)}>
            <section
              className="detail-modal"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '460px' }}
            >
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="modal-icon" style={{ margin: 0, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <p className="eyebrow" style={{ color: '#dc2626' }}>Confirm Removal</p>
                    <h2 style={{ margin: 0, fontSize: '18px' }}>Remove Family Member</h2>
                  </div>
                </div>
              </div>
              <p style={{ margin: '14px 0', fontSize: '13.5px', color: 'var(--family-muted)', lineHeight: '1.5' }}>
                Are you sure you want to remove <strong>{memberToDelete.name}</strong> ({memberToDelete.relation}) from this family account?
              </p>
              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="secondary-button" onClick={() => setMemberToDelete(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-button"
                  style={{ backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                  onClick={handleExecuteDelete}
                >
                  Remove Member
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
