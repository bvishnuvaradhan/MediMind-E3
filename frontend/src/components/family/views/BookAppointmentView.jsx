import { useState } from 'react';
import { CalendarDays, Sparkles, ArrowLeft, User, Stethoscope, Clock, AlertCircle } from 'lucide-react';

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

  // Automatically select patient and doctor from context
  const patientName = rescheduleData?.detail?.split(' · ')[1] || assessment?.patient || member.name;
  const initialDoctor = rescheduleData?.detail?.split(' · ')[0] || assessment?.doctor || selectedDoctor?.title || 'Dr. Rahul Mehta';

  const [booking, setBooking] = useState({
    patient: patientName,
    doctor: initialDoctor,
    date: rescheduleData ? '2026-09-24' : assessment?.urgency === 'high' ? '2026-09-17' : '2026-09-18',
    slot: assessment?.urgency === 'high' ? '10:30 AM' : '11:15 AM',
    reason: assessment?.reason || (rescheduleData ? `Reschedule: ${rescheduleData.title}` : 'Routine specialist review and treatment follow-up'),
    type: rescheduleData ? rescheduleData.title : 'Follow-up consultation',
    mode: 'In-person OPD Clinic',
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
      <div className="feature-heading" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="feature-icon" style={{ backgroundColor: 'var(--family-primary-subtle)', color: 'var(--family-primary)' }}>
            <CalendarDays size={22} />
          </span>
          <div>
            <p className="eyebrow" style={{ margin: '0 0 2px 0' }}>{isReschedule ? 'Appointment Reschedule' : 'Care Scheduling'}</p>
            <h1 style={{ margin: 0, fontSize: '22px' }}>{isReschedule ? 'Reschedule Appointment' : 'Book a new appointment'}</h1>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--family-muted)' }}>
              {isReschedule ? 'Modify consultation date or timing slot for your existing visit.' : 'Select preferred visit mode and available time slot.'}
            </p>
          </div>
        </div>

        <button
          className="secondary-button compact-button"
          onClick={handleBack}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {isReschedule && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef3c7', borderRadius: '10px', border: '1px solid #fde68a', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#92400e', lineHeight: '1.4' }}>
            <strong>Rescheduling Mode:</strong> Updating existing appointment <em>"{rescheduleData?.title}"</em>. Your previous slot will be released upon confirmation.
          </span>
        </div>
      )}

      <form className="booking-form" onSubmit={handleSubmit}>
        {/* 1. Patient & 2. Doctor Context Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
          {/* Patient Card (Read-only context) */}
          <div className="info-tile" style={{ backgroundColor: 'var(--family-soft)' }}>
            <span className="info-tile-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} style={{ color: 'var(--family-primary)' }} /> 1. Selected Patient
            </span>
            <span className="info-tile-value" style={{ fontSize: '15px' }}>{booking.patient}</span>
            <span className="info-tile-sub">Contextual patient profile</span>
          </div>

          {/* Doctor Card */}
          <div className="info-tile" style={{ backgroundColor: 'var(--family-soft)' }}>
            <span className="info-tile-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Stethoscope size={14} style={{ color: 'var(--family-primary)' }} /> 2. Selected Specialist
            </span>
            <span className="info-tile-value" style={{ fontSize: '15px' }}>{booking.doctor}</span>
            <span className="info-tile-sub">Consulting Specialist</span>
          </div>
        </div>

        {assessment && !isReschedule && (
          <div className={`assessment-result ${assessment.urgency}`} style={{ margin: '0 0 16px 0' }}>
            <div>
              <Sparkles size={17} />
              <strong>AI Triage Summary · {assessment.severity}</strong>
            </div>
            <p>{assessment.summary}</p>
            {assessment.fileName && <small>Attached intake file: {assessment.fileName}</small>}
          </div>
        )}

        {/* 3. Appointment Type & Mode, 4. Date, 5. Slots */}
        <div className="booking-section-card" style={{ padding: '18px 20px', margin: '0 0 16px 0' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} style={{ color: 'var(--family-primary)' }} />
            3. Schedule Date & Consultation Details
          </h3>

          <div className="form-grid">
            <label>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Appointment Type</span>
              <select
                className="feature-input"
                value={booking.type}
                onChange={(event) => updateBooking('type', event.target.value)}
              >
                <option>Follow-up consultation</option>
                <option>First-time specialist consultation</option>
                <option>Routine annual health review</option>
                <option>Diagnostic imaging / Lab review</option>
              </select>
            </label>

            <label>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Consultation Mode</span>
              <select
                className="feature-input"
                value={booking.mode}
                onChange={(event) => updateBooking('mode', event.target.value)}
              >
                <option>In-person OPD Clinic</option>
                <option>Secure Video Consultation</option>
                <option>Audio Telehealth Call</option>
              </select>
            </label>

            <label>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Appointment Date</span>
              <input
                type="date"
                className="feature-input"
                value={booking.date}
                min="2026-09-17"
                onChange={(event) => updateSchedule('date', event.target.value)}
                required
              />
            </label>

            <label>
              <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>Available Time Slot</span>
              <select
                className="feature-input"
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
          </div>

          <label className="booking-reason" style={{ marginTop: '14px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)' }}>
              Consultation Notes / Visit Reason
            </span>
            <textarea
              className="feature-input"
              value={booking.reason}
              onChange={(event) => updateBooking('reason', event.target.value)}
              placeholder="Describe current symptoms or topics for discussion with the doctor..."
              rows={2}
              required
            />
          </label>
        </div>

        {/* 6. Appointment Summary Card */}
        <div style={{ padding: '16px 20px', backgroundColor: 'var(--family-soft)', borderRadius: '10px', border: '1px solid var(--family-border)', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--family-muted)', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
            6. Confirmed Booking Summary
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--family-ink)', display: 'block' }}>
                {booking.type} with {booking.doctor}
              </strong>
              <span style={{ fontSize: '12.5px', color: 'var(--family-muted)' }}>
                Patient: <strong>{booking.patient}</strong> · {booking.mode}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--family-primary)', display: 'block' }}>
                📅 {booking.date} at {booking.slot}
              </span>
              <span style={{ fontSize: '11.5px', color: '#16a34a' }}>
                ✓ Slot Guaranteed
              </span>
            </div>
          </div>
        </div>

        {/* 7. Confirm Booking Action */}
        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={handleBack}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={!booking.slot}>
            <CalendarDays size={16} /> {isReschedule ? 'Confirm Reschedule' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </section>
  );
}
