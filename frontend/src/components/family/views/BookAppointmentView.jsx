import { useState } from 'react';
import { CalendarDays, ArrowUpRight, Sparkles, LockKeyhole, ShieldCheck } from 'lucide-react';

export function BookAppointmentView({
  member: propMember,
  familyMembers = [],
  selectedDoctor,
  assessment: propAssessment,
  appointmentAssessment,
  bookedSlots = {},
  onBookAppointment,
  handleBookAppointment,
  navigate,
  announce,
}) {
  const member = propMember || familyMembers[0] || { name: 'Father' };
  const assessment = propAssessment || appointmentAssessment;
  const submitBooking = onBookAppointment || handleBookAppointment || (() => true);
  const slotOptions = ['10:30 AM', '11:15 AM', '2:00 PM', '4:30 PM'];

  const [booking, setBooking] = useState({
    patient: member.name,
    doctor: assessment?.doctor ?? selectedDoctor?.title ?? 'Dr. Rahul Mehta',
    date: assessment?.urgency === 'high' ? '2026-09-17' : '2026-09-18',
    slot: assessment?.urgency === 'high' ? '10:30 AM' : '11:15 AM',
    reason: assessment?.reason ?? '',
    type: 'Follow-up consultation',
    mode: 'In-person',
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

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!booking.reason.trim()) {
      announce('Please add a reason for the appointment.');
      return;
    }

    if (!booking.slot) {
      announce('There are no available slots for this doctor on the selected date.');
      return;
    }

    if (!submitBooking(booking)) return;

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
          <p className="eyebrow">Appointments</p>
          <h1>Book a new appointment</h1>
          <p>Choose a patient, care provider, available slot, and visit details.</p>
        </div>
        <button
          className="secondary-button compact-button"
          onClick={() => navigate('Appointments')}
        >
          <ArrowUpRight size={16} /> Back to appointments
        </button>
      </div>

      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="booking-form-header">
          <div>
            <h2>Appointment details</h2>
            <p>All fields help the care team prepare for the visit.</p>
          </div>
          <span className="booking-status">
            <CalendarDays size={15} /> Slots available
          </span>
        </div>

        {assessment && (
          <div className={`assessment-result ${assessment.urgency}`}>
            <div>
              <Sparkles size={17} />
              <strong>AI summary · {assessment.severity}</strong>
            </div>
            <p>{assessment.summary}</p>
            {assessment.fileName && <small>Attached report: {assessment.fileName}</small>}
          </div>
        )}

        <div className="booking-access-notice">
          <LockKeyhole size={16} />
          <span>
            Booking confirms only the appointment. It does not grant this doctor access to medical
            records. Use Doctor Access separately to share records.
          </span>
        </div>

        <div className="form-grid">
          <label>
            <span>Patient profile</span>
            <select
              value={booking.patient}
              onChange={(event) => updateBooking('patient', event.target.value)}
            >
              <option>Father</option>
              <option>Mother</option>
              <option>Son</option>
              <option>{member.name}</option>
            </select>
          </label>

          <label>
            <span>Assigned doctor</span>
            <select
              value={booking.doctor}
              onChange={(event) => updateSchedule('doctor', event.target.value)}
            >
              <option value="Dr. Rahul Mehta">Dr. Rahul Mehta · Orthopedics</option>
              <option value="Dr. Ananya Rao">Dr. Ananya Rao · Cardiology</option>
              <option value="Dr. Kumar Iyer">Dr. Kumar Iyer · General medicine</option>
            </select>
          </label>

          <label>
            <span>Appointment date</span>
            <input
              type="date"
              value={booking.date}
              min="2026-09-17"
              onChange={(event) => updateSchedule('date', event.target.value)}
            />
          </label>

          <label>
            <span>Available time slot</span>
            <select
              value={booking.slot}
              onChange={(event) => updateBooking('slot', event.target.value)}
            >
              {slotOptions.map((slot) => (
                <option
                  key={slot}
                  value={slot}
                  disabled={getBookedSlots(booking.doctor, booking.date).includes(slot)}
                >
                  {slot}
                  {getBookedSlots(booking.doctor, booking.date).includes(slot) ? ' (Booked)' : ''}
                </option>
              ))}
            </select>
            <small className="field-hint">
              Booked slots are disabled automatically for this doctor and date.
            </small>
          </label>

          <label>
            <span>Appointment type</span>
            <select
              value={booking.type}
              onChange={(event) => updateBooking('type', event.target.value)}
            >
              <option>Follow-up consultation</option>
              <option>First consultation</option>
              <option>Routine check-up</option>
              <option>Diagnostic review</option>
            </select>
          </label>

          <label>
            <span>Consultation mode</span>
            <select
              value={booking.mode}
              onChange={(event) => updateBooking('mode', event.target.value)}
            >
              <option>In-person</option>
              <option>Video consultation</option>
              <option>Phone consultation</option>
            </select>
          </label>
        </div>

        <label className="booking-reason">
          <span>Why does the patient need this appointment?</span>
          <textarea
            value={booking.reason}
            onChange={(event) => updateBooking('reason', event.target.value)}
            placeholder="Describe symptoms, follow-up needs, or what you want to discuss"
            required
          />
        </label>

        <div className="booking-summary">
          <ShieldCheck size={17} />
          <span>
            {booking.slot
              ? `Selected slot: ${booking.date} at ${booking.slot} with ${booking.doctor} · ${booking.mode}`
              : 'No slots are available for this doctor on the selected date.'}
          </span>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('Appointments')}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={!booking.slot}>
            <CalendarDays size={16} /> Confirm appointment
          </button>
        </div>
      </form>
    </section>
  );
}
