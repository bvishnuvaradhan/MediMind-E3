import { useState } from 'react';
import { CalendarDays, Users, Sparkles, Plus, ArrowUpRight } from 'lucide-react';
import { initialPresentationData } from '../../../data/medimindData';

export function AppointmentsView({
  announce,
  navigate,
  openFeatureModal,
  bookedAppointments = [],
  appointmentStatuses = {},
  onCancelAppointment,
  onRescheduleAppointment,
  familyMembers = [],
  setReturnTo,
}) {
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('All');

  const baseItems = initialPresentationData.Appointments || [];
  const allAppointments = [...baseItems, ...bookedAppointments];

  // Filter appointments by member
  const filteredAppointments = allAppointments.filter((apt) => {
    if (selectedMemberFilter === 'All') return true;
    const target = selectedMemberFilter.toLowerCase();
    const detail = (apt.detail || '').toLowerCase();
    const patientName = (apt.patientName || apt.patient || '').toLowerCase();
    return detail.includes(target) || patientName.includes(target) || target.includes(patientName);
  });

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <CalendarDays size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Appointments</h1>
          <p>Schedule, manage, and review care consultations for your family.</p>
        </div>

        {/* Book Appointment button placed clearly on the RIGHT side of the page header */}
        <button
          className="primary-button compact-button"
          onClick={() => {
            if (setReturnTo) setReturnTo('Appointments');
            navigate('Appointment assessment');
            announce('Starting appointment symptom assessment.');
          }}
        >
          <Plus size={16} /> Book appointment
        </button>
      </div>

      <div className="feature-panel">
        {/* Controls Bar: Member Filter */}
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
                announce(e.target.value === 'All' ? 'Viewing appointments for all family members.' : `Filtered appointments for ${e.target.value}.`);
              }}
              style={{ padding: '6px 12px', fontSize: '13px', minWidth: '200px', fontWeight: '600' }}
            >
              <option value="All">All Family Members ({allAppointments.length})</option>
              {familyMembers.map((m) => {
                const mName = m.fullName || m.name;
                const mRel = m.relationship || m.relation || 'Member';
                const count = allAppointments.filter((apt) => {
                  const detail = (apt.detail || '').toLowerCase();
                  const patientName = (apt.patientName || apt.patient || '').toLowerCase();
                  return detail.includes(m.name.toLowerCase()) || (m.fullName && detail.includes(m.fullName.toLowerCase())) || patientName.includes(m.name.toLowerCase());
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
            Showing <strong>{filteredAppointments.length}</strong> of {allAppointments.length} scheduled visits
          </div>
        </div>

        {/* Appointments List */}
        <div className="feature-list">
          {filteredAppointments.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--family-muted)', backgroundColor: 'var(--family-soft)', borderRadius: '10px' }}>
              No appointments found for {selectedMemberFilter === 'All' ? 'any family member' : selectedMemberFilter}.
            </div>
          ) : (
            filteredAppointments.map((item, idx) => {
              const itemKey = `${item.title}|${item.detail}`;
              const isCancelled = appointmentStatuses[itemKey] === 'Cancelled';
              const isWalkIn = item.type === 'Walk-in' || (item.title && item.title.toLowerCase().includes('walk-in'));

              return (
                <article className="feature-card" key={`apt-${item.title}-${idx}`}>
                  <div className={`avatar avatar-${item.tone || 'coral'}`}>{item.initials || '01'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '14px' }}>{item.title}</h3>
                      {isCancelled ? (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '600' }}>
                          Cancelled
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#16a34a', fontWeight: '600' }}>
                          Confirmed
                        </span>
                      )}

                      {/* Linked AI Screening status badge */}
                      {isWalkIn ? (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#64748b', fontWeight: '500' }}>
                          Walk-in (AI Not Required)
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ede9fe', color: '#7c3aed', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Sparkles size={12} /> AI Pre-Screened
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--family-muted)' }}>
                      {item.detail}
                    </p>
                    <span className="feature-meta" style={{ marginTop: '2px', display: 'block', fontSize: '12px' }}>
                      {item.meta}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="feature-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="text-button"
                      onClick={() => openFeatureModal(item, 'Appointments')}
                    >
                      View details <ArrowUpRight size={14} />
                    </button>
                    {!isCancelled && (
                      <>
                        <button
                          className="text-button"
                          onClick={() => onRescheduleAppointment(item)}
                        >
                          Reschedule
                        </button>
                        <button
                          className="text-button danger-action"
                          style={{ color: '#dc2626' }}
                          onClick={() => onCancelAppointment(item)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

