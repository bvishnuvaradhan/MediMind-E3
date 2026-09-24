import { X, CalendarDays, Stethoscope, Clock, MapPin, User } from 'lucide-react';

export function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  onReschedule,
  onCancel,
}) {
  if (!isOpen || !appointment) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="detail-modal appointment-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-detail-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="modal-icon" style={{ margin: 0, backgroundColor: 'var(--family-primary-subtle)', color: 'var(--family-primary)' }}>
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="eyebrow">Appointment Overview</p>
              <h2 id="appointment-detail-title" style={{ margin: 0, fontSize: '18px' }}>
                {appointment.title}
              </h2>
            </div>
          </div>
          <button className="close-form" onClick={onClose} aria-label="Close appointment details">
            <X size={18} />
          </button>
        </div>

        <div style={{ margin: '16px 0', padding: '16px', backgroundColor: 'var(--family-soft)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Stethoscope size={18} style={{ color: 'var(--family-primary)' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '14px', color: 'var(--family-ink)' }}>
                {appointment.detail?.split(' · ')[0] || appointment.doctor || 'Dr. Rahul Mehta'}
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--family-muted)' }}>
                {appointment.department || 'Specialist Consultation'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--family-ink)' }}>
              <Clock size={16} style={{ color: 'var(--family-subtle)' }} />
              <span>{appointment.meta || '18 Sep 2026 · 10:30 AM'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--family-ink)' }}>
              <User size={16} style={{ color: 'var(--family-subtle)' }} />
              <span>Patient: <strong>{appointment.detail?.split(' · ')[1] || appointment.patient || 'Father'}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--family-muted)', marginTop: '2px' }}>
            <MapPin size={15} style={{ color: 'var(--family-subtle)' }} />
            <span>MediMind Central Hospital · OPD Wing 3, Floor 2</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '14px 0' }}>
          <div style={{ padding: '10px 12px', backgroundColor: 'var(--family-card)', borderRadius: '8px', border: '1px solid var(--family-border)' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--family-muted)', display: 'block', marginBottom: '2px' }}>
              Instructions for Visit
            </span>
            <span style={{ fontSize: '12.5px', color: 'var(--family-ink)', lineHeight: '1.4' }}>
              Please arrive 15 minutes prior to the scheduled slot. Bring previous lab reports, X-rays, and insurance card if applicable.
            </span>
          </div>
        </div>

        <div className="modal-actions" style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {onCancel && (
            <button
              type="button"
              className="text-button danger-action"
              onClick={() => {
                onClose();
                onCancel(appointment);
              }}
              style={{ color: '#dc2626', fontSize: '13px', fontWeight: '600' }}
            >
              Cancel appointment
            </button>
          )}

          <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
            {onReschedule && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  onClose();
                  onReschedule(appointment);
                }}
              >
                Reschedule
              </button>
            )}
            <button type="button" className="primary-button" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
