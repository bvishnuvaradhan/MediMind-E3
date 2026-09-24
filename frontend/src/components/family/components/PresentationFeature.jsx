import { CalendarDays, ArrowUpRight } from 'lucide-react';
import { initialPresentationData } from '../../../data/familyMockData';

export function PresentationFeature({
  page,
  announce,
  navigate,
  openFeatureModal,
  bookedAppointments = [],
  appointmentStatuses = {},
  onCancelAppointment,
  onRescheduleAppointment,
  setSelectedDoctor,
}) {
  const featureItems =
    page === 'Appointments'
      ? [...initialPresentationData[page], ...bookedAppointments]
      : initialPresentationData[page];

  return (
    <div className="feature-list">
      {featureItems.map((item) => (
        <article className="feature-card" key={`${page}-${item.title}`}>
          <div className={`avatar avatar-${item.tone}`}>{item.initials}</div>
          <div>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
            <span className="feature-meta">{item.meta}</span>
          </div>
          {page === 'Doctors' ? (
            <div className="feature-actions">
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
          ) : page === 'Appointments' ? (
            <div className="feature-actions">
              <button className="text-button" onClick={() => openFeatureModal(item, page)}>
                View details <ArrowUpRight size={14} />
              </button>
              <button
                className="text-button"
                disabled={appointmentStatuses[`${item.title}|${item.detail}`] === 'Cancelled'}
                onClick={() => onRescheduleAppointment(item)}
              >
                Reschedule
              </button>
              <button
                className="text-button danger-action"
                disabled={appointmentStatuses[`${item.title}|${item.detail}`] === 'Cancelled'}
                onClick={() => onCancelAppointment(item)}
              >
                {appointmentStatuses[`${item.title}|${item.detail}`] === 'Cancelled'
                  ? 'Cancelled'
                  : 'Cancel'}
              </button>
            </div>
          ) : (
            <button
              className="text-button"
              onClick={() =>
                ['Consultations', 'Prescriptions'].includes(page)
                  ? openFeatureModal(item, page)
                  : announce(`${item.action}: ${item.title}.`)
              }
            >
              {item.action} <ArrowUpRight size={14} />
            </button>
          )}
        </article>
      ))}
    </div>
  );
}
