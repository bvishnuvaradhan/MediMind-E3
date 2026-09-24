import { CalendarDays } from 'lucide-react';
import { PresentationFeature } from '../components/PresentationFeature';

export function AppointmentsView({
  announce,
  navigate,
  openFeatureModal,
  bookedAppointments,
  appointmentStatuses,
  onCancelAppointment,
  onRescheduleAppointment,
}) {
  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <CalendarDays size={20} />
        </span>
        <div>
          <p className="eyebrow">Family account</p>
          <h1>Appointments</h1>
          <p>Book and manage care for a specific family member.</p>
        </div>

        <button
          className="primary-button compact-button"
          onClick={() => navigate('Appointment AI assessment')}
        >
          <CalendarDays size={16} /> Book appointment
        </button>
      </div>

      <div className="feature-panel">
        <PresentationFeature
          page="Appointments"
          announce={announce}
          navigate={navigate}
          openFeatureModal={openFeatureModal}
          bookedAppointments={bookedAppointments}
          appointmentStatuses={appointmentStatuses}
          onCancelAppointment={onCancelAppointment}
          onRescheduleAppointment={onRescheduleAppointment}
        />
      </div>
    </section>
  );
}
