import { UsersRound, Plus, ArrowUpRight, Trash2, X } from 'lucide-react';

export function FamilyMembersView({
  familyMembers,
  setMemberIndex,
  navigate,
  announce,
  showAddMember,
  setShowAddMember,
  newMember,
  setNewMember,
  handleAddMember,
  handleDeleteMember,
}) {
  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <UsersRound size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Family members</h1>
          <p>Manage patient profiles in your family account.</p>
        </div>

        <button className="primary-button compact-button" onClick={() => setShowAddMember(true)}>
          <Plus size={16} /> Add member
        </button>
      </div>

      <div className="feature-panel">
        <div className="feature-list">
          {familyMembers.map((item, index) => (
            <article className="feature-card" key={`${item.name}-${index}`}>
              <div className={`avatar avatar-${item.tone}`}>{item.initials}</div>
              <div>
                <h3>{item.name}</h3>
                <p>
                  {item.relation} · {item.records} records · {item.predictions} predictions
                </p>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  setMemberIndex(index);
                  navigate('Member profile');
                  announce(`Opening ${item.name}'s profile.`);
                }}
              >
                View profile <ArrowUpRight size={14} />
              </button>
              <button
                type="button"
                className="delete-member-button"
                onClick={() => handleDeleteMember(index)}
                aria-label={`Delete ${item.name}`}
                title={`Delete ${item.name}`}
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
        </div>

        {showAddMember && (
          <form className="add-member-form" onSubmit={handleAddMember}>
            <div className="form-header">
              <h3>Add family member</h3>
              <button
                type="button"
                className="close-form"
                onClick={() => setShowAddMember(false)}
                aria-label="Close add-member form"
              >
                <X size={16} />
              </button>
            </div>

            <div className="form-grid">
              <label>
                <span>Name</span>
                <input
                  value={newMember.name}
                  onChange={(event) =>
                    setNewMember((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Enter member name"
                  required
                />
              </label>

              <label>
                <span>Relation</span>
                <select
                  value={newMember.relation}
                  onChange={(event) =>
                    setNewMember((current) => ({ ...current, relation: event.target.value }))
                  }
                >
                  <option>Family member</option>
                  <option>You</option>
                  <option>Spouse</option>
                  <option>Child</option>
                  <option>Parent</option>
                  <option>Other</option>
                </select>
                {newMember.relation === 'Other' && (
                  <input
                    value={newMember.customRelation}
                    onChange={(event) =>
                      setNewMember((current) => ({
                        ...current,
                        customRelation: event.target.value,
                      }))
                    }
                    placeholder="Enter custom relation"
                    aria-label="Custom relation"
                    required
                  />
                )}
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowAddMember(false)}
              >
                Cancel
              </button>
              <button type="submit" className="primary-button">
                Save member
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
