import { CalendarDays, ArrowUpRight } from 'lucide-react';
import { initialPresentationData } from '../../../data/familyMockData';

export function PresentationFeature({
  page,
  navigate,
  openFeatureModal,
  bookedAppointments = [],
  appointmentStatuses = {},
  onCancelAppointment,
  onRescheduleAppointment,
  setSelectedDoctor,
}) {
  const baseItems = initialPresentationData[page] || [];
  const featureItems =
    page === 'Appointments'
      ? [...baseItems, ...bookedAppointments]
      : baseItems;

  return (
    <div className="feature-list">
      {featureItems.map((item, idx) => {
        const itemKey = `${item.title}|${item.detail}`;
        const isCancelled = appointmentStatuses[itemKey] === 'Cancelled';

        return (
          <article className="feature-card" key={`${page}-${item.title}-${idx}`}>
            <div className={`avatar avatar-${item.tone}`}>{item.initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '14px' }}>{item.title}</h3>
                {isCancelled && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#dc2626', fontWeight: '600' }}>
                    Cancelled
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

            {/* Right-aligned action buttons */}
            {page === 'Doctors' && (
              <div className="feature-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="text-button"
                  onClick={() => {
                    if (setSelectedDoctor) setSelectedDoctor(item);
                    navigate('Appointment assessment');
                  }}
                >
                  Book appointment <CalendarDays size={14} />
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    if (setSelectedDoctor) setSelectedDoctor(item);
                    navigate('Doctor profile');
                  }}
                >
                  View profile <ArrowUpRight size={14} />
                </button>
              </div>
            )}

            {page === 'Appointments' && (
              <div className="feature-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="text-button"
                  onClick={() => openFeatureModal(item, page)}
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
            )}

            {page === 'Consultations' && (
              <div className="feature-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="text-button"
                  onClick={() => openFeatureModal(item, 'Consultations')}
                >
                  Open Notes <ArrowUpRight size={14} />
                </button>
              </div>
            )}

            {page === 'Prescriptions' && (
              <div className="feature-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="text-button"
                  onClick={() => openFeatureModal(item, 'Prescriptions')}
                >
                  View Prescription <ArrowUpRight size={14} />
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
