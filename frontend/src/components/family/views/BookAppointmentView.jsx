import { useState } from 'react';
import { CalendarDays, Sparkles, ShieldCheck, ArrowLeft, User, Stethoscope } from 'lucide-react';

export function BookAppointmentView({
  member: propMember,
  familyMembers = [],
  selectedDoctor,
  appointmentAssessment,
  bookedSlots = {},
  rescheduleData = null,
  returnTo = 'Appointments',
  onBookAppointment,
  handleBookAppointment,
  onUpdateRescheduledAppointment,
  navigate,
  announce,
}) {
  const member = propMember || familyMembers[0] || { name: 'Father' };
  const assessment = appointmentAssessment;
  const isReschedule = !!rescheduleData;

  const slotOptions = ['10:30 AM', '11:15 AM', '2:00 PM', '3:30 PM', '4:30 PM'];

  // Automatically select patient based on context
  const patientName = rescheduleData?.detail?.split(' · ')[1] || assessment?.patient || member.name;
  const initialDoctor = rescheduleData?.detail?.split(' · ')[0] || assessment?.doctor || selectedDoctor?.title || 'Dr. Rahul Mehta';

  const [booking, setBooking] = useState({
    patient: patientName,
    doctor: initialDoctor,
    date: rescheduleData ? '2026-09-24' : assessment?.urgency === 'high' ? '2026-09-17' : '2026-09-18',
    slot: assessment?.urgency === 'high' ? '10:30 AM' : '11:15 AM',
    reason: assessment?.reason || (rescheduleData ? `Reschedule: ${rescheduleData.title}` : 'Routine specialist review and treatment follow-up'),
    type: rescheduleData ? rescheduleData.title : 'Follow-up consultation',
    mode: 'In-person OPD',
  });

  const getBookedSlots = (doctor, date) => bookedSlots[`${doctor}|${date}`] ?? [];
  const getAvailableSlots = (doctor, date) =>
    slotOptions.filter((slot) => !getBookedSlots(doctor, date).includes(slot));

  const updateBooking = (field, value) =>
    setBooking((current) => ({ ...current, [field]: value }));

  const updateSchedule = (field, value) => {
    const nextDoctor = field === 'doctor' ? value : booking.doctor;
    const nextDate = field === 'date' ? value : booking.date;
    const availableSlots = getAvailableSlots(nextDoctor, nextDate);
    setBooking((current) => ({
      ...current,
      [field]: value,
      slot: availableSlots.includes(current.slot) ? current.slot : availableSlots[0] ?? '',
    }));
  };

  const handleBack = () => {
    if (isReschedule) {
      navigate('Appointments');
    } else {
      navigate(returnTo === 'Doctor profile' || returnTo === 'Doctors' ? 'Appointment assessment' : (returnTo || 'Appointments'));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!booking.reason.trim()) {
      announce('Please enter a reason or notes for the appointment.');
      return;
    }

    if (!booking.slot) {
      announce('There are no available slots for this doctor on the selected date. Please choose another date.');
      return;
    }

    if (isReschedule) {
      if (onUpdateRescheduledAppointment) {
        onUpdateRescheduledAppointment(rescheduleData, booking);
      }
      announce(`Appointment rescheduled with ${booking.doctor} for ${booking.date} at ${booking.slot}.`);
      navigate('Appointments');
      return;
    }

    const submitFn = onBookAppointment || handleBookAppointment;
    if (submitFn) {
      const success = submitFn(booking);
      if (!success && success !== undefined) return;
    }

    announce(
      `Appointment booked with ${booking.doctor} for ${booking.patient} on ${booking.date} at ${booking.slot}.`
    );
    navigate('Appointments');
  };

  return (
    <section className="feature-view">
      <div className="feature-heading">
        <span className="feature-icon">
          <CalendarDays size={20} />
        </span>
        <div>
          <p className="eyebrow">{isReschedule ? 'Reschedule Booking' : 'Appointment Scheduling'}</p>
          <h1>{isReschedule ? 'Reschedule Appointment' : 'Book a new appointment'}</h1>
          <p>{isReschedule ? 'Select a new date and time slot for your scheduled visit.' : 'Select preferred consultation slot and care details.'}</p>
        </div>

        <button
          className="secondary-button compact-button"
          onClick={handleBack}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="booking-form-header">
          <div>
            <h2>{isReschedule ? 'Updated Visit Details' : 'Appointment Details'}</h2>
            <p>Your care team will prepare for the visit based on this intake.</p>
          </div>
          <span className="booking-status">
            <CalendarDays size={15} /> Verified Slots
          </span>
        </div>

        {/* Unobtrusive Patient & Doctor Badge Context */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            padding: '14px',
            backgroundColor: 'var(--family-soft)',
            borderRadius: '10px',
            border: '1px solid var(--family-border)',
            margin: '4px 0 14px 0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={18} style={{ color: 'var(--family-primary)' }} />
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--family-muted)', fontWeight: '700' }}>
                Patient
              </span>
              <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--family-ink)' }}>
                {booking.patient}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Stethoscope size={18} style={{ color: 'var(--family-primary)' }} />
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--family-muted)', fontWeight: '700' }}>
                Specialist
              </span>
              <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--family-ink)' }}>
                {booking.doctor}
              </strong>
            </div>
          </div>
        </div>

        {assessment && (
          <div className={`assessment-result ${assessment.urgency}`} style={{ margin: '8px 0 16px 0' }}>
            <div>
              <Sparkles size={17} />
              <strong>AI Triage Summary · {assessment.severity}</strong>
            </div>
            <p>{assessment.summary}</p>
            {assessment.fileName && <small>Attached intake file: {assessment.fileName}</small>}
          </div>
        )}

        <div className="form-grid">
          <label>
            <span>Assigned Specialist</span>
            <select
              value={booking.doctor}
              onChange={(event) => updateSchedule('doctor', event.target.value)}
            >
              <option value="Dr. Rahul Mehta">Dr. Rahul Mehta · Orthopedics</option>
              <option value="Dr. Ananya Rao">Dr. Ananya Rao · Cardiology</option>
              <option value="Dr. Kavya Shah">Dr. Kavya Shah · Diabetology</option>
              <option value="Dr. Kumar Iyer">Dr. Kumar Iyer · General Medicine</option>
            </select>
          </label>

          <label>
            <span>Appointment Date</span>
            <input
              type="date"
              value={booking.date}
              min="2026-09-17"
              onChange={(event) => updateSchedule('date', event.target.value)}
              required
            />
          </label>

          <label>
            <span>Available Time Slot</span>
            <select
              value={booking.slot}
              onChange={(event) => updateBooking('slot', event.target.value)}
              required
            >
              {slotOptions.map((slot) => {
                const isBooked = getBookedSlots(booking.doctor, booking.date).includes(slot);
                return (
                  <option key={slot} value={slot} disabled={isBooked}>
                    {slot} {isBooked ? '(Booked)' : '— Available'}
                  </option>
                );
              })}
            </select>
          </label>

          <label>
            <span>Consultation Mode</span>
            <select
              value={booking.mode}
              onChange={(event) => updateBooking('mode', event.target.value)}
            >
              <option>In-person OPD</option>
              <option>Secure Video Consultation</option>
              <option>Audio Telehealth Call</option>
            </select>
          </label>

          <label style={{ gridColumn: 'span 2' }}>
            <span>Appointment Type</span>
            <select
              value={booking.type}
              onChange={(event) => updateBooking('type', event.target.value)}
            >
              <option>Follow-up consultation</option>
              <option>First-time specialist consultation</option>
              <option>Routine annual health review</option>
              <option>Diagnostic imaging / Lab review</option>
            </select>
          </label>
        </div>

        <label className="booking-reason" style={{ marginTop: '12px' }}>
          <span>Reason for Consultation / Clinical Notes</span>
          <textarea
            value={booking.reason}
            onChange={(event) => updateBooking('reason', event.target.value)}
            placeholder="Describe current symptoms or topics for discussion..."
            rows={2}
            required
          />
        </label>

        <div className="booking-summary">
          <ShieldCheck size={16} style={{ color: 'var(--family-primary)', flexShrink: 0 }} />
          <span>
            {booking.slot
              ? `Confirmed slot: ${booking.date} at ${booking.slot} with ${booking.doctor} (${booking.mode}).`
              : 'Please choose an alternate date with open slots.'}
          </span>
        </div>

        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={handleBack}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={!booking.slot}>
            <CalendarDays size={16} /> {isReschedule ? 'Confirm Reschedule' : 'Confirm Appointment'}
          </button>
        </div>
      </form>
    </section>
  );
}
