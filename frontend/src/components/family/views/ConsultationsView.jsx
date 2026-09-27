import { useState } from 'react';
import { Activity, Users, ArrowUpRight } from 'lucide-react';
import { initialPresentationData } from '../../../data/medimindData';

export function ConsultationsView({
  announce,
  openFeatureModal,
  familyMembers = [],
}) {
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('All');

  const baseItems = initialPresentationData.Consultations || [];

  const filteredItems = baseItems.filter((item) => {
    if (selectedMemberFilter === 'All') return true;
    const target = selectedMemberFilter.toLowerCase();
    const detail = (item.detail || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    return detail.includes(target) || title.includes(target);
  });

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <Activity size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Consultations</h1>
          <p>Review doctor notes, treatment plans, and linked records.</p>
        </div>
      </div>

      <div className="feature-panel">
        {/* Member Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid var(--family-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--family-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Users size={14} style={{ color: 'var(--family-primary)' }} />
              Member:
            </span>
            <select
              className="feature-input"
              value={selectedMemberFilter}
              onChange={(e) => {
                setSelectedMemberFilter(e.target.value);
                announce(e.target.value === 'All' ? 'Viewing consultations for all family members.' : `Filtered consultations for ${e.target.value}.`);
              }}
              style={{ padding: '6px 12px', fontSize: '13px', minWidth: '200px', fontWeight: '600' }}
            >
              <option value="All">All Family Members ({baseItems.length})</option>
              {familyMembers.map((m) => {
                const mName = m.fullName || m.name;
                const mRel = m.relationship || m.relation || 'Member';
                const count = baseItems.filter((item) => {
                  const detail = (item.detail || '').toLowerCase();
                  return detail.includes(m.name.toLowerCase()) || (m.fullName && detail.includes(m.fullName.toLowerCase()));
                }).length;
                return (
                  <option key={m.id || m.name} value={m.name}>
                    {mName} — {mRel} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--family-muted)' }}>
            Showing <strong>{filteredItems.length}</strong> of {baseItems.length} consultations
          </div>
        </div>

        {/* Consultations List */}
        <div className="feature-list">
          {filteredItems.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--family-muted)', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
              No consultation notes found for {selectedMemberFilter === 'All' ? 'any family member' : selectedMemberFilter}.
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <article className="feature-card" key={`cons-${item.title}-${idx}`}>
                <div className={`avatar avatar-${item.tone || 'coral'}`}>{item.initials || 'RM'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '14px' }}>{item.title}</h3>
                  <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--family-muted)' }}>
                    {item.detail}
                  </p>
                  <span className="feature-meta" style={{ marginTop: '2px', display: 'block', fontSize: '12px' }}>
                    {item.meta}
                  </span>
                </div>

                <div className="feature-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="text-button"
                    onClick={() => openFeatureModal(item, 'Consultations')}
                  >
                    Open Notes <ArrowUpRight size={14} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

